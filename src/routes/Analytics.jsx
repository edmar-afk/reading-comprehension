
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  Award,
  BarChart3,
  BookOpen,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  FileText,
  MessageSquareText,
  RefreshCw,
  Search,
  Target,
  TrendingUp,
  Users,
  X,
} from "lucide-react";

import Sidebar from "../components/sidebar/SideBar";
import api from "../assets/api";

const PAGE_SIZE = 8;

const parseScore = (value) => {
  if (value === null || value === undefined || value === "") return null;

  const normalized = String(value).trim().replace(/%$/, "").trim();
  const score = Number(normalized);

  if (!Number.isFinite(score) || score < 0 || score > 100) return null;

  return score;
};

const formatScore = (score) => {
  if (score === null || score === undefined) return "—";
  return `${Number(score.toFixed(2))}%`;
};

const formatDate = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const getStudentName = (rating) => {
  if (rating.student_name) return rating.student_name;

  if (typeof rating.student === "object" && rating.student) {
    const fullName = [
      rating.student.first_name,
      rating.student.last_name,
    ]
      .filter(Boolean)
      .join(" ");

    return fullName || rating.student.username || "Unnamed Student";
  }

  return `Student #${rating.student ?? "Unknown"}`;
};

const getMaterialTitle = (rating) => {
  if (rating.material_title_text) return rating.material_title_text;

  if (
    typeof rating.material_title === "object" &&
    rating.material_title
  ) {
    return rating.material_title.title || "Untitled material";
  }

  return rating.material_title != null
    ? `Material #${rating.material_title}`
    : "Untitled material";
};

const getStudentId = (rating) => {
  if (typeof rating.student === "object" && rating.student) {
    return rating.student.id ?? null;
  }

  return rating.student ?? null;
};

const getMaterialId = (rating) => {
  if (typeof rating.material_title === "object" && rating.material_title) {
    return rating.material_title.id ?? null;
  }

  return rating.material_title ?? null;
};

const getScoreStyle = (score) => {
  if (score === null || score === undefined) {
    return {
      label: "No score",
      badge: "bg-gray-100 text-gray-500",
      bar: "bg-gray-300",
    };
  }

  if (score >= 90) {
    return {
      label: "Excellent",
      badge: "bg-emerald-50 text-emerald-700 ring-emerald-200",
      bar: "bg-emerald-500",
    };
  }

  if (score >= 75) {
    return {
      label: "Good",
      badge: "bg-blue-50 text-blue-700 ring-blue-200",
      bar: "bg-blue-500",
    };
  }

  if (score >= 60) {
    return {
      label: "Developing",
      badge: "bg-amber-50 text-amber-700 ring-amber-200",
      bar: "bg-amber-500",
    };
  }

  return {
    label: "Needs practice",
    badge: "bg-red-50 text-red-700 ring-red-200",
    bar: "bg-red-500",
  };
};

const ScoreBadge = ({ score }) => {
  const style = getScoreStyle(score);

  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-lg px-2.5 py-1 text-xs font-bold ring-1 ring-inset ${style.badge}`}
    >
      {formatScore(score)}
    </span>
  );
};

const SummaryCard = ({
  title,
  value,
  description,
  icon: Icon,
  iconStyle,
}) => (
  <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className="mt-2 text-2xl font-bold tracking-tight text-gray-800">
          {value}
        </p>
        <p className="mt-1 text-xs text-gray-400">{description}</p>
      </div>

      <div className={`rounded-xl p-3 ${iconStyle}`}>
        <Icon size={22} />
      </div>
    </div>
  </div>
);

const EmptyState = ({ message }) => (
  <div className="flex flex-col items-center justify-center px-5 py-12 text-center">
    <div className="mb-3 rounded-2xl bg-gray-100 p-4 text-gray-400">
      <BookOpen size={28} />
    </div>
    <p className="text-sm font-semibold text-gray-600">{message}</p>
  </div>
);

const Analytics = () => {
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMaterial, setSelectedMaterial] = useState("all");
  const [selectedBand, setSelectedBand] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedFeedback, setSelectedFeedback] = useState(null);

  const fetchRatings = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/api/ratings/");

      const data = Array.isArray(response.data)
        ? response.data
        : Array.isArray(response.data?.results)
          ? response.data.results
          : [];

      setRatings(data);
    } catch (err) {
      console.error("Failed to fetch reading analytics:", err);

      setError(
        err.response?.data?.detail ||
          "Unable to load reading analytics. Check the Django server and ratings API.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRatings();
  }, [fetchRatings]);

  // Normalize rating records without changing the original API data.
  const assessments = useMemo(
    () =>
      ratings.map((rating, index) => ({
        ...rating,
        _key: rating.id ?? `${getStudentId(rating)}-${index}`,
        _studentId: getStudentId(rating),
        _materialId: getMaterialId(rating),
        _studentName: getStudentName(rating),
        _materialTitle: getMaterialTitle(rating),
        _score: parseScore(rating.rate),
        _feedback: String(rating.feedback || "").trim(),
      })),
    [ratings],
  );

  const validAssessments = useMemo(
    () => assessments.filter((item) => item._score !== null),
    [assessments],
  );

  const materials = useMemo(() => {
    const materialMap = new Map();

    assessments.forEach((item) => {
      const key =
        item._materialId != null
          ? String(item._materialId)
          : item._materialTitle;

      if (!materialMap.has(key)) {
        materialMap.set(key, {
          id: key,
          title: item._materialTitle,
        });
      }
    });

    return Array.from(materialMap.values()).sort((a, b) =>
      a.title.localeCompare(b.title),
    );
  }, [assessments]);

  // Aggregate the results for each reading material.
  const materialAnalytics = useMemo(() => {
    const grouped = new Map();

    validAssessments.forEach((item) => {
      const key =
        item._materialId != null
          ? String(item._materialId)
          : item._materialTitle;

      if (!grouped.has(key)) {
        grouped.set(key, {
          id: key,
          title: item._materialTitle,
          totalScore: 0,
          count: 0,
          students: new Set(),
          excellent: 0,
          good: 0,
          developing: 0,
          needsPractice: 0,
        });
      }

      const group = grouped.get(key);
      group.totalScore += item._score;
      group.count += 1;

      if (item._studentId != null) {
        group.students.add(String(item._studentId));
      }

      if (item._score >= 90) {
        group.excellent += 1;
      } else if (item._score >= 75) {
        group.good += 1;
      } else if (item._score >= 60) {
        group.developing += 1;
      } else {
        group.needsPractice += 1;
      }
    });

    return Array.from(grouped.values())
      .map((item) => ({
        ...item,
        average: item.count ? item.totalScore / item.count : 0,
        studentCount: item.students.size,
      }))
      .sort((a, b) => b.average - a.average);
  }, [validAssessments]);

  const overallAverage = useMemo(() => {
    if (!validAssessments.length) return null;

    return (
      validAssessments.reduce((sum, item) => sum + item._score, 0) /
      validAssessments.length
    );
  }, [validAssessments]);

  const assessedStudentCount = useMemo(() => {
    const students = new Set();

    validAssessments.forEach((item) => {
      if (item._studentId != null) {
        students.add(String(item._studentId));
      }
    });

    return students.size;
  }, [validAssessments]);

  const scoreDistribution = useMemo(() => {
    const bands = [
      {
        key: "excellent",
        label: "Excellent",
        range: "90–100%",
        count: 0,
        color: "bg-emerald-500",
        text: "text-emerald-700",
      },
      {
        key: "good",
        label: "Good",
        range: "75–89%",
        count: 0,
        color: "bg-blue-500",
        text: "text-blue-700",
      },
      {
        key: "developing",
        label: "Developing",
        range: "60–74%",
        count: 0,
        color: "bg-amber-500",
        text: "text-amber-700",
      },
      {
        key: "needsPractice",
        label: "Needs practice",
        range: "0–59%",
        count: 0,
        color: "bg-red-500",
        text: "text-red-700",
      },
    ];

    validAssessments.forEach((item) => {
      if (item._score >= 90) bands[0].count += 1;
      else if (item._score >= 75) bands[1].count += 1;
      else if (item._score >= 60) bands[2].count += 1;
      else bands[3].count += 1;
    });

    return bands;
  }, [validAssessments]);

  const filteredAssessments = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return assessments.filter((item) => {
      const matchesSearch =
        !query ||
        item._studentName.toLowerCase().includes(query) ||
        item._materialTitle.toLowerCase().includes(query) ||
        item._feedback.toLowerCase().includes(query);

      const materialKey =
        item._materialId != null
          ? String(item._materialId)
          : item._materialTitle;

      const matchesMaterial =
        selectedMaterial === "all" || materialKey === selectedMaterial;

      const matchesBand =
        selectedBand === "all" ||
        (item._score !== null &&
          ((selectedBand === "excellent" && item._score >= 90) ||
            (selectedBand === "good" &&
              item._score >= 75 &&
              item._score < 90) ||
            (selectedBand === "developing" &&
              item._score >= 60 &&
              item._score < 75) ||
            (selectedBand === "needsPractice" && item._score < 60)));

      return matchesSearch && matchesMaterial && matchesBand;
    });
  }, [assessments, searchTerm, selectedMaterial, selectedBand]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredAssessments.length / PAGE_SIZE),
  );

  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedAssessments = useMemo(() => {
    const start = (safeCurrentPage - 1) * PAGE_SIZE;
    return filteredAssessments.slice(start, start + PAGE_SIZE);
  }, [filteredAssessments, safeCurrentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedMaterial, selectedBand]);

  const firstEntry = filteredAssessments.length
    ? (safeCurrentPage - 1) * PAGE_SIZE + 1
    : 0;

  const lastEntry = Math.min(
    safeCurrentPage * PAGE_SIZE,
    filteredAssessments.length,
  );

  const maxMaterialStudents = Math.max(
    1,
    ...materialAnalytics.map((item) => item.studentCount),
  );

  const maxBandCount = Math.max(
    1,
    ...scoreDistribution.map((item) => item.count),
  );

  return (
    <>
      <Sidebar />

      <main className="min-h-screen bg-[#F8FAFC] p-4 sm:p-6 lg:ml-72 lg:p-8">
        <div className="mx-auto max-w-[1600px]">
          {/* Header */}
          <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-800">
                <BarChart3 size={25} />
              </div>

              <div>
                <h1 className="text-2xl font-bold text-gray-800">
                  Reading Analytics
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                  Monitor student reading performance, assessment scores, and
                  feedback across reading materials.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={fetchRatings}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:opacity-50"
            >
              <RefreshCw
                size={17}
                className={loading ? "animate-spin" : ""}
              />
              Refresh
            </button>
          </div>

          {error && (
            <div
              role="alert"
              className="mb-6 flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between"
            >
              <p>{error}</p>
              <button
                type="button"
                onClick={fetchRatings}
                className="font-semibold underline underline-offset-2"
              >
                Try again
              </button>
            </div>
          )}

          {/* Summary cards */}
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryCard
              title="Students Assessed"
              value={assessedStudentCount.toLocaleString()}
              description="Unique students with valid scores"
              icon={Users}
              iconStyle="bg-blue-50 text-blue-600"
            />

            <SummaryCard
              title="Materials Assessed"
              value={materialAnalytics.length.toLocaleString()}
              description="Materials with valid scores"
              icon={BookOpen}
              iconStyle="bg-emerald-50 text-emerald-600"
            />

            <SummaryCard
              title="Assessment Records"
              value={ratings.length.toLocaleString()}
              description={`${validAssessments.length} with valid numeric scores`}
              icon={FileText}
              iconStyle="bg-violet-50 text-violet-600"
            />

            <SummaryCard
              title="Overall Average"
              value={formatScore(overallAverage)}
              description="Average across valid assessment records"
              icon={Target}
              iconStyle="bg-amber-50 text-amber-600"
            />
          </div>

          {/* Material performance graph */}
          <section className="mb-6 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <div className="rounded-lg bg-emerald-50 p-2 text-emerald-700">
                    <TrendingUp size={20} />
                  </div>
                  <h2 className="text-lg font-bold text-gray-800">
                    Reading Material Performance
                  </h2>
                </div>

                <p className="mt-2 text-sm text-gray-500">
                  Average score and unique student count for each material.
                </p>
              </div>

              <span className="w-fit rounded-lg bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-500">
                Sorted by average score
              </span>
            </div>

            {loading && ratings.length === 0 ? (
              <EmptyState message="Loading reading performance..." />
            ) : materialAnalytics.length === 0 ? (
              <EmptyState message="No valid reading assessment scores yet." />
            ) : (
              <>
                <div className="mb-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-gray-500">
                  <span className="inline-flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                    Average score
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                    Student count
                  </span>
                </div>

                <div className="space-y-5">
                  {materialAnalytics.map((material) => {
                    const scoreStyle = getScoreStyle(material.average);

                    return (
                      <div key={material.id}>
                        <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <div className="min-w-0">
                            <p
                              title={material.title}
                              className="truncate text-sm font-semibold text-gray-800"
                            >
                              {material.title}
                            </p>
                            <p className="mt-0.5 text-xs text-gray-400">
                              {material.count}{" "}
                              {material.count === 1
                                ? "assessment"
                                : "assessments"}
                            </p>
                          </div>

                          <div className="flex shrink-0 items-center gap-3">
                            <ScoreBadge score={material.average} />
                            <span className="min-w-20 text-right text-xs font-semibold text-blue-700">
                              {material.studentCount}{" "}
                              {material.studentCount === 1
                                ? "student"
                                : "students"}
                            </span>
                          </div>
                        </div>

                        <div
                          className="h-3 overflow-hidden rounded-full bg-gray-100"
                          role="progressbar"
                          aria-label={`${material.title} average score`}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-valuenow={Number(material.average.toFixed(2))}
                        >
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${scoreStyle.bar}`}
                            style={{
                              width: `${Math.min(
                                100,
                                Math.max(0, material.average),
                              )}%`,
                            }}
                          />
                        </div>

                        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-gray-100">
                          <div
                            className="h-full rounded-full bg-blue-400 transition-all duration-500"
                            style={{
                              width: `${
                                (material.studentCount / maxMaterialStudents) *
                                100
                              }%`,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                <p className="mt-5 text-xs leading-5 text-gray-400">
                  The green bar represents the average percentage score out of
                  100. The blue bar compares the number of unique students
                  between materials; its scale is relative to the material
                  with the most students.
                </p>
              </>
            )}
          </section>

          {/* Score distribution */}
          <section className="mb-6 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-xl bg-violet-50 p-2.5 text-violet-600">
                <Activity size={22} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-800">
                  Score Distribution
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Number of assessment records in each score range.
                </p>
              </div>
            </div>

            {validAssessments.length === 0 ? (
              <EmptyState message="Score distribution will appear when scores are available." />
            ) : (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
                {scoreDistribution.map((band) => {
                  const percentage =
                    (band.count / validAssessments.length) * 100;

                  return (
                    <div
                      key={band.key}
                      className="rounded-xl border border-gray-100 bg-gray-50/70 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className={`text-sm font-semibold ${band.text}`}>
                            {band.label}
                          </p>
                          <p className="mt-1 text-xs text-gray-400">
                            {band.range}
                          </p>
                        </div>

                        <p className="text-xl font-bold text-gray-800">
                          {band.count}
                        </p>
                      </div>

                      <div className="mt-4 h-2 overflow-hidden rounded-full bg-gray-200">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${band.color}`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>

                      <p className="mt-2 text-xs text-gray-500">
                        {percentage.toFixed(1)}% of valid assessments
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Assessment records */}
          <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
            <div className="flex flex-col gap-4 border-b border-gray-100 p-5 sm:p-6">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <MessageSquareText
                      size={21}
                      className="text-emerald-700"
                    />
                    <h2 className="text-lg font-bold text-gray-800">
                      Student Assessment Records
                    </h2>
                  </div>
                  <p className="mt-1 text-sm text-gray-500">
                    Review scores and detailed feedback for each reading
                    attempt.
                  </p>
                </div>

                <span className="w-fit rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                  {filteredAssessments.length} records
                </span>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <div className="relative md:col-span-1">
                  <Search
                    size={17}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="search"
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Search student, material, feedback..."
                    className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-4 text-sm text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <select
                  value={selectedMaterial}
                  onChange={(event) => setSelectedMaterial(event.target.value)}
                  aria-label="Filter by reading material"
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm text-gray-700 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                >
                  <option value="all">All reading materials</option>
                  {materials.map((material) => (
                    <option key={material.id} value={material.id}>
                      {material.title}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedBand}
                  onChange={(event) => setSelectedBand(event.target.value)}
                  aria-label="Filter by score range"
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm text-gray-700 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                >
                  <option value="all">All score ranges</option>
                  <option value="excellent">Excellent · 90–100%</option>
                  <option value="good">Good · 75–89%</option>
                  <option value="developing">Developing · 60–74%</option>
                  <option value="needsPractice">Needs practice · 0–59%</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-gray-100 bg-[#F8FAFC] text-xs font-semibold uppercase tracking-wider text-gray-600">
                    <th className="whitespace-nowrap px-5 py-4">
                      Student
                    </th>
                    <th className="min-w-52 px-5 py-4">
                      Reading Material
                    </th>
                    <th className="whitespace-nowrap px-5 py-4">
                      Score
                    </th>
                    <th className="whitespace-nowrap px-5 py-4">
                      Performance
                    </th>
                    <th className="whitespace-nowrap px-5 py-4">
                      Date Assessed
                    </th>
                    <th className="whitespace-nowrap px-5 py-4 text-center">
                      Feedback
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-50">
                  {loading && ratings.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-5 py-12 text-center text-sm text-gray-500"
                      >
                        Loading assessment records...
                      </td>
                    </tr>
                  ) : paginatedAssessments.length > 0 ? (
                    paginatedAssessments.map((item) => {
                      const style = getScoreStyle(item._score);

                      return (
                        <tr
                          key={item._key}
                          className="transition-colors hover:bg-emerald-50/30"
                        >
                          <td className="min-w-48 px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-sm font-bold text-emerald-700">
                                {item._studentName
                                  .trim()
                                  .charAt(0)
                                  .toUpperCase() || "S"}
                              </div>

                              <div className="min-w-0">
                                <p
                                  title={item._studentName}
                                  className="max-w-48 truncate text-sm font-semibold text-gray-800"
                                >
                                  {item._studentName}
                                </p>
                                <p className="mt-0.5 text-xs text-gray-400">
                                  {item._studentId != null
                                    ? `Student ID: ${item._studentId}`
                                    : "Student"}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="min-w-52 px-5 py-4">
                            <div className="flex items-center gap-2.5">
                              <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
                                <BookOpen size={17} />
                              </div>
                              <p className="max-w-64 text-sm font-medium text-gray-700">
                                {item._materialTitle}
                              </p>
                            </div>
                          </td>

                          <td className="whitespace-nowrap px-5 py-4">
                            <ScoreBadge score={item._score} />
                          </td>

                          <td className="whitespace-nowrap px-5 py-4">
                            <span
                              className={`inline-flex rounded-lg px-2.5 py-1 text-xs font-semibold ${style.badge}`}
                            >
                              {style.label}
                            </span>
                          </td>

                          <td className="whitespace-nowrap px-5 py-4">
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <CalendarDays
                                size={16}
                                className="text-gray-400"
                              />
                              {formatDate(item.created)}
                            </div>
                          </td>

                          <td className="whitespace-nowrap px-5 py-4 text-center">
                            <button
                              type="button"
                              onClick={() => setSelectedFeedback(item)}
                              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-600 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
                            >
                              <MessageSquareText size={15} />
                              View feedback
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6}>
                        <EmptyState
                          message={
                            searchTerm ||
                            selectedMaterial !== "all" ||
                            selectedBand !== "all"
                              ? "No assessment records match your filters."
                              : "No reading assessment records found."
                          }
                        />
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex flex-col items-center justify-between gap-4 border-t border-gray-100 px-5 py-5 sm:flex-row sm:px-6">
              <p className="text-xs font-medium text-gray-500">
                Showing {firstEntry} to {lastEntry} of{" "}
                {filteredAssessments.length} records
              </p>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  aria-label="Previous page"
                  onClick={() =>
                    setCurrentPage((page) => Math.max(1, page - 1))
                  }
                  disabled={safeCurrentPage <= 1}
                  className="rounded-xl border border-gray-200 p-2 text-gray-500 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft size={16} />
                </button>

                <span className="px-3 text-xs font-semibold text-gray-600">
                  Page {safeCurrentPage} of {totalPages}
                </span>

                <button
                  type="button"
                  aria-label="Next page"
                  onClick={() =>
                    setCurrentPage((page) =>
                      Math.min(totalPages, page + 1),
                    )
                  }
                  disabled={safeCurrentPage >= totalPages}
                  className="rounded-xl border border-gray-200 p-2 text-gray-500 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </section>

          <p className="mt-4 text-xs leading-5 text-gray-400">
            Analytics are calculated from the rating records returned by
            Django. Score averages use valid numeric scores from 0 to 100;
            invalid or missing scores are excluded from charts and averages,
            but their records remain available in the assessment table.
          </p>
        </div>
      </main>

      {/* Feedback modal */}
      {selectedFeedback && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-950/50 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedFeedback(null);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="feedback-modal-title"
            className="max-h-[85vh] w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4 border-b border-gray-100 p-5 sm:p-6">
              <div className="min-w-0">
                <div className="mb-2 flex items-center gap-2 text-emerald-700">
                  <MessageSquareText size={20} />
                  <span className="text-xs font-bold uppercase tracking-wider">
                    Assessment feedback
                  </span>
                </div>

                <h2
                  id="feedback-modal-title"
                  className="text-xl font-bold text-gray-800"
                >
                  {selectedFeedback._studentName}
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  {selectedFeedback._materialTitle}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedFeedback(null)}
                aria-label="Close feedback"
                className="shrink-0 rounded-xl border border-gray-200 p-2 text-gray-500 transition hover:bg-gray-100"
              >
                <X size={19} />
              </button>
            </div>

            <div className="max-h-[calc(85vh-180px)] overflow-y-auto p-5 sm:p-6">
              <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-xl bg-gray-50 p-3">
                  <p className="text-xs text-gray-500">Score</p>
                  <p className="mt-1 text-lg font-bold text-gray-800">
                    {formatScore(selectedFeedback._score)}
                  </p>
                </div>

                <div className="rounded-xl bg-gray-50 p-3">
                  <p className="text-xs text-gray-500">Performance</p>
                  <p
                    className={`mt-1 text-sm font-bold ${
                      getScoreStyle(selectedFeedback._score).badge
                        .split(" ")
                        .find((value) => value.startsWith("text-")) ||
                      "text-gray-700"
                    }`}
                  >
                    {getScoreStyle(selectedFeedback._score).label}
                  </p>
                </div>

                <div className="rounded-xl bg-gray-50 p-3">
                  <p className="text-xs text-gray-500">Date assessed</p>
                  <p className="mt-1 text-sm font-semibold text-gray-800">
                    {formatDate(selectedFeedback.created)}
                  </p>
                </div>
              </div>

              <h3 className="mb-3 text-sm font-bold text-gray-800">
                Feedback report
              </h3>

              <div className="rounded-xl border border-gray-100 bg-[#F8FAFC] p-4">
                {selectedFeedback._feedback ? (
                  <p className="whitespace-pre-wrap break-words text-sm leading-7 text-gray-600">
                    {selectedFeedback._feedback}
                  </p>
                ) : (
                  <p className="text-sm italic text-gray-400">
                    No feedback was provided for this assessment.
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end border-t border-gray-100 p-4 sm:p-5">
              <button
                type="button"
                onClick={() => setSelectedFeedback(null)}
                className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Analytics;
