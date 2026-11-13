import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  CalendarDays,
  RefreshCw,
  Search,
  Users,
  X,
} from "lucide-react";

import api from "../../assets/api";
import FeedbackModal from "../students/FeedbackModal";

const MAX_SUBMISSIONS = 5;

const parseScore = (value) => {
  if (value === null || value === undefined || value === "") return null;

  const normalized = String(value).trim().replace(/%$/, "").trim();
  const score = Number(normalized);

  if (!Number.isFinite(score) || score < 0 || score > 100) return null;

  return score;
};

const formatScore = (score) => {
  if (score === null) return "—";
  return `${Number(score.toFixed(2))}%`;
};

const formatDate = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const getStudentId = (rating) => {
  if (typeof rating.student === "object" && rating.student) {
    return rating.student.id;
  }

  return rating.student;
};

const getMaterialId = (rating) => {
  if (typeof rating.material_title === "object" && rating.material_title) {
    return rating.material_title.id;
  }

  return rating.material_title;
};

const getStudentName = (rating) => {
  if (rating.student_name) return rating.student_name;

  if (typeof rating.student === "object" && rating.student) {
    const fullName = [rating.student.first_name, rating.student.last_name]
      .filter(Boolean)
      .join(" ");

    return fullName || rating.student.username || "Unnamed Student";
  }

  return rating.student != null
    ? `Student #${rating.student}`
    : "Unnamed Student";
};

const getMaterialTitle = (rating) => {
  if (rating.material_title_text) return rating.material_title_text;

  if (typeof rating.material_title === "object" && rating.material_title) {
    return rating.material_title.title || "Untitled material";
  }

  return rating.material_title != null
    ? `Material #${rating.material_title}`
    : "Untitled material";
};

const getScoreColor = (score) => {
  if (score === null) return "text-gray-400";
  if (score >= 90) return "text-emerald-600";
  if (score >= 75) return "text-blue-600";
  if (score >= 60) return "text-amber-600";
  return "text-red-600";
};

const RecentSubmissions = () => {
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
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

      const normalized = data
        .map((rating, index) => ({
          ...rating,
          _key: rating.id ?? `${rating.student}-${index}`,
          _name: getStudentName(rating),
          _material: getMaterialTitle(rating),
          _score: parseScore(rating.rate),
        }))
        .sort((a, b) => {
          const dateA = new Date(a.created || 0).getTime();
          const dateB = new Date(b.created || 0).getTime();

          return dateB - dateA;
        });

      setRatings(normalized);
    } catch (err) {
      console.error("Failed to fetch recent submissions:", err);
      setError("Unable to load recent reading assessments.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRatings();
  }, [fetchRatings]);

  const filteredSubmissions = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return ratings;

    return ratings.filter((submission) => {
      return (
        submission._name.toLowerCase().includes(query) ||
        submission._material.toLowerCase().includes(query) ||
        String(submission.rate ?? "")
          .toLowerCase()
          .includes(query) ||
        String(submission.feedback ?? "")
          .toLowerCase()
          .includes(query)
      );
    });
  }, [ratings, search]);

  const recentSubmissions = filteredSubmissions.slice(0, MAX_SUBMISSIONS);

  // IMPORTANT: Pass the original rating's student and material IDs.
  const openFeedback = (submission) => {
    const studentId = getStudentId(submission);
    const materialId = getMaterialId(submission);

    setSelectedFeedback({
      student: {
        id: studentId,
        name: submission._name,
        username:
          typeof submission.student === "object"
            ? submission.student?.username
            : "",
      },

      material: {
        id: materialId,
        student: studentId,
        material_title: materialId,

        title: submission._material,
        score: submission._score,
        rate: submission.rate,
        created: submission.created,
        feedback: submission.feedback || "",
        ratingId: submission.id ?? null,
      },
    });
  };

  return (
    <>
      <div className="flex-1 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        {/* Header */}
        <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-800">
              Recent Submissions
            </h2>
            <p className="mt-1 text-xs text-gray-400">
              Latest student reading assessments
            </p>
          </div>

          <button
            type="button"
            onClick={fetchRatings}
            disabled={loading}
            title="Refresh submissions"
            aria-label="Refresh submissions"
            className="self-end rounded-lg border border-gray-200 p-2 text-gray-500 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 sm:self-auto"
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-5">
          <Search
            size={17}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />

          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search student, material, score, or feedback..."
            aria-label="Search recent submissions"
            className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-10 pr-10 text-sm text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100"
          />

          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              aria-label="Clear search"
              title="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-gray-400 transition hover:bg-gray-200 hover:text-gray-700"
            >
              <X size={15} />
            </button>
          )}
        </div>

        {/* Submission list */}
        {loading && ratings.length === 0 ? (
          <div className="py-10 text-center text-sm text-gray-400">
            Loading recent submissions...
          </div>
        ) : error ? (
          <div className="py-8 text-center">
            <p className="text-sm text-red-600">{error}</p>
            <button
              type="button"
              onClick={fetchRatings}
              className="mt-3 text-xs font-semibold text-emerald-700 hover:underline"
            >
              Try again
            </button>
          </div>
        ) : recentSubmissions.length === 0 ? (
          <div className="flex flex-col items-center py-10 text-center">
            <div className="mb-3 rounded-xl bg-gray-100 p-3 text-gray-400">
              {search ? <Search size={23} /> : <Users size={23} />}
            </div>

            <p className="text-sm font-semibold text-gray-600">
              {search ? "No matching submissions" : "No submissions yet"}
            </p>

            <p className="mt-1 max-w-xs text-xs text-gray-400">
              {search
                ? "Try another student name, material title, score, or keyword."
                : "Student reading assessments will appear here."}
            </p>

            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="mt-3 text-xs font-semibold text-emerald-700 hover:underline"
              >
                Clear search
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {recentSubmissions.map((sub) => {
              const name = sub._name || "Unnamed Student";
              const avatarSeed = encodeURIComponent(name);

              return (
                <div
                  key={sub._key}
                  role="button"
                  tabIndex={0}
                  aria-label={`View feedback for ${name}, ${sub._material}`}
                  onClick={() => openFeedback(sub)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      openFeedback(sub);
                    }
                  }}
                  className="group flex cursor-pointer flex-col gap-3 rounded-xl border border-transparent border-b-gray-100 p-3 transition duration-200 hover:border-emerald-100 hover:bg-emerald-50/60 focus:outline-none focus:ring-2 focus:ring-emerald-300 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full border border-emerald-200 bg-emerald-100">
                      <img
                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${avatarSeed}`}
                        alt=""
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <h4 className="truncate text-sm font-semibold text-gray-800 transition group-hover:text-emerald-700">
                        {name}
                      </h4>

                      <div className="mt-1 flex min-w-0 items-start gap-1.5">
                        <BookOpen
                          size={13}
                          className="mt-0.5 shrink-0 text-emerald-600"
                        />

                        <p
                          title={sub._material}
                          className="line-clamp-2 text-xs leading-5 text-gray-500"
                        >
                          Took the {sub._material} Challenge
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center justify-between gap-4 sm:flex-col sm:items-end sm:gap-1">
                    <span
                      className={`text-sm font-bold ${getScoreColor(sub._score)}`}
                    >
                      Score: {formatScore(sub._score)}
                    </span>

                    <span className="inline-flex items-center gap-1.5 text-xs text-gray-400">
                      <CalendarDays size={13} />
                      {formatDate(sub.created)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Search result count */}
        {!loading && !error && filteredSubmissions.length > 0 && (
          <p className="mt-4 border-t border-gray-100 pt-3 text-xs text-gray-400">
            Showing {recentSubmissions.length} of {filteredSubmissions.length}
            {search ? " matching" : ""} submission
            {filteredSubmissions.length === 1 ? "" : "s"}
            {filteredSubmissions.length > MAX_SUBMISSIONS
              ? " · Search to find other records"
              : ""}
          </p>
        )}
      </div>

      {/* Feedback modal */}
      {selectedFeedback && (
        <FeedbackModal
          student={selectedFeedback.student}
          material={selectedFeedback.material}
          onClose={() => setSelectedFeedback(null)}
        />
      )}
    </>
  );
};

export default RecentSubmissions;
