import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Search,
  Eye,
  Users,
  ChevronLeft,
  ChevronRight,
  UserPlus,
  RefreshCw,
  Trash2,
  Trophy,
  BookOpen,
  Award,
  BarChart3,
} from "lucide-react";

import Swal from "sweetalert2";
import user from "../assets/images/user.jpg";
import Sidebar from "../components/sidebar/SideBar";
import AddStudentModal from "../components/students/AddStudentModal";
import EditStudentModal from "../components/students/EditStudentModal";
import api from "../assets/api";

const PAGE_SIZE = 5;

const normalizeStudent = (item) => {
  const firstName = item.first_name || "";
  const lastName = item.last_name || "";

  const name =
    item.full_name ||
    [firstName, lastName].filter(Boolean).join(" ") ||
    item.username ||
    "Unnamed Student";

  return {
    ...item,
    id: item.id,
    name,
    avatarSeed: name,
  };
};

// Converts the Django TextField rate into a numeric score.
// Accepts only scores from 1 to 100.

const parseScore = (value) => {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  // Accept values such as "16%", "16", or 16.
  const normalized = String(value).trim().replace(/%$/, "").trim();
  const score = Number(normalized);

  if (!Number.isFinite(score) || score < 0 || score > 100) {
    return null;
  }

  return score;
};

const formatScore = (score) => {
  if (score === null || score === undefined) return "—";

  return `${Number(score.toFixed(2))}%`;
};

const ScoreBadge = ({ score }) => {
  if (score === null || score === undefined) {
    return (
      <span className="inline-flex items-center rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-500">
        No score
      </span>
    );
  }

  const color =
    score >= 90
      ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
      : score >= 75
        ? "bg-blue-50 text-blue-700 ring-blue-200"
        : score >= 60
          ? "bg-amber-50 text-amber-700 ring-amber-200"
          : "bg-red-50 text-red-700 ring-red-200";

  return (
    <span
      className={`inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-bold ring-1 ring-inset ${color}`}
    >
      {formatScore(score)}
    </span>
  );
};

const MaterialCell = ({ material, icon: Icon, variant = "best" }) => {
  if (!material) {
    return (
      <div className="flex min-w-40 items-center justify-center gap-2 text-gray-400">
        <BookOpen size={17} />
        <span className="text-sm">No ratings yet</span>
      </div>
    );
  }

  const iconColor = variant === "best" ? "text-emerald-600" : "text-amber-600";

  return (
    <div className="mx-auto flex min-w-48 max-w-64 items-center gap-3 text-left">
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
          variant === "best" ? "bg-emerald-50" : "bg-amber-50"
        }`}
      >
        <Icon size={19} className={iconColor} />
      </div>

      <div className="min-w-0">
        <p
          title={material.title}
          className="truncate text-sm font-semibold text-gray-800"
        >
          {material.title || "Untitled material"}
        </p>

        <div className="mt-1">
          <ScoreBadge score={material.score} />
        </div>
      </div>
    </div>
  );
};

const PerformanceCell = ({ score }) => {
  if (score === null || score === undefined) {
    return (
      <div className="mx-auto flex w-28 flex-col items-center gap-1">
        <span className="text-sm font-semibold text-gray-400">No data</span>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100" />
      </div>
    );
  }

  const progressColor =
    score >= 90
      ? "bg-emerald-500"
      : score >= 75
        ? "bg-blue-500"
        : score >= 60
          ? "bg-amber-500"
          : "bg-red-500";

  const label =
    score >= 90
      ? "Excellent"
      : score >= 75
        ? "Good"
        : score >= 60
          ? "Developing"
          : "Needs practice";

  return (
    <div className="mx-auto flex w-28 flex-col items-center gap-1.5">
      <span className="text-xs font-semibold text-gray-600">{label}</span>

      <div
        className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100"
        role="progressbar"
        aria-label={`Highest score ${formatScore(score)}`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={score}
      >
        <div
          className={`h-full rounded-full transition-all ${progressColor}`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
};

// Build each student's highest and lowest individual rating records
// using the data returned by /api/ratings/.
const buildStudentPerformance = (ratings) => {
  const performanceByStudent = new Map();

  ratings.forEach((rating) => {
    const studentId =
      typeof rating.student === "object" ? rating.student?.id : rating.student;

    const materialId =
      typeof rating.material_title === "object"
        ? rating.material_title?.id
        : rating.material_title;

    const score = parseScore(rating.rate);

    if (studentId == null || materialId == null || score === null) {
      return;
    }

    const materialTitle =
      rating.material_title_text ||
      (typeof rating.material_title === "object"
        ? rating.material_title?.title
        : "") ||
      `Material #${materialId}`;

    const studentKey = String(studentId);

    if (!performanceByStudent.has(studentKey)) {
      performanceByStudent.set(studentKey, {
        highest: null,
        lowest: null,
        materialsRated: 0,
      });
    }

    const performance = performanceByStudent.get(studentKey);

    const record = {
      materialId,
      title: materialTitle,
      score,
      created: rating.created || null,
    };

    // Highest individual rating for this student.
    if (!performance.highest || record.score > performance.highest.score) {
      performance.highest = record;
    }

    // Lowest individual rating for this student.
    if (!performance.lowest || record.score < performance.lowest.score) {
      performance.lowest = record;
    }

    // Count valid rating records for the summary card.
    performance.materialsRated += 1;
  });

  return performanceByStudent;
};

const getStudentPerformance = (studentId, performanceByStudent) => {
  return (
    performanceByStudent.get(String(studentId)) || {
      highest: null,
      lowest: null,
      materialsRated: 0,
    }
  );
};

const Students = () => {
  const [students, setStudents] = useState([]);
  const [ratings, setRatings] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [studentToEdit, setStudentToEdit] = useState(null);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [studentsResponse, ratingsResponse] = await Promise.all([
        api.get("/api/users/"),
        api.get("/api/ratings/"),
      ]);

      const studentData = Array.isArray(studentsResponse.data)
        ? studentsResponse.data
        : Array.isArray(studentsResponse.data?.results)
          ? studentsResponse.data.results
          : Array.isArray(studentsResponse.data?.users)
            ? studentsResponse.data.users
            : [];

      const ratingsData = Array.isArray(ratingsResponse.data)
        ? ratingsResponse.data
        : Array.isArray(ratingsResponse.data?.results)
          ? ratingsResponse.data.results
          : [];

      setStudents(
        studentData
          .map(normalizeStudent)
          .filter((student) => student.id != null),
      );

      setRatings(ratingsData);
    } catch (err) {
      console.error("Failed to fetch students or ratings:", err);

      setError(
        err.response?.data?.detail ||
          "Unable to load students and reading scores. Check your Django server, API URLs, and ratings endpoint.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const performanceByStudent = useMemo(
    () => buildStudentPerformance(ratings),
    [ratings],
  );

  const filteredStudents = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return students.filter(
      (student) =>
        student.name.toLowerCase().includes(query) ||
        String(student.username || "")
          .toLowerCase()
          .includes(query),
    );
  }, [students, searchTerm]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredStudents.length / PAGE_SIZE),
  );

  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedStudents = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * PAGE_SIZE;

    return filteredStudents.slice(startIndex, startIndex + PAGE_SIZE);
  }, [filteredStudents, safeCurrentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const firstEntry =
    filteredStudents.length === 0 ? 0 : (safeCurrentPage - 1) * PAGE_SIZE + 1;

  const lastEntry = Math.min(
    safeCurrentPage * PAGE_SIZE,
    filteredStudents.length,
  );

  const handleRefresh = async () => {
    await fetchStudents();
  };

  const handleDeleteStudent = async (student) => {
    const result = await Swal.fire({
      title: "Delete Student?",
      html: `Are you sure you want to delete <strong>${student.name}</strong>?<br/><br/>This action cannot be undone.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#DC2626",
      cancelButtonColor: "#6B7280",
      reverseButtons: true,
      focusCancel: true,
      customClass: {
        container: "swal-high-z-index",
      },
    });

    if (!result.isConfirmed) return;

    try {
      Swal.fire({
        title: "Deleting...",
        text: "Please wait while the student account is deleted.",
        allowOutsideClick: false,
        allowEscapeKey: false,
        customClass: {
          container: "swal-high-z-index",
        },
        didOpen: () => Swal.showLoading(),
      });

      await api.delete(`/api/users/delete/${student.id}/`);

      setStudents((previous) =>
        previous.filter((item) => item.id !== student.id),
      );

      setRatings((previous) =>
        previous.filter((rating) => {
          const id =
            typeof rating.student === "object"
              ? rating.student?.id
              : rating.student;

          return String(id) !== String(student.id);
        }),
      );

      setCurrentPage((page) => {
        const remainingCount = filteredStudents.length - 1;
        const newTotalPages = Math.max(
          1,
          Math.ceil(Math.max(remainingCount, 0) / PAGE_SIZE),
        );

        return Math.min(page, newTotalPages);
      });

      await Swal.fire({
        title: "Deleted!",
        text: `${student.name} has been deleted successfully.`,
        icon: "success",
        confirmButtonColor: "#059669",
        timer: 1800,
        timerProgressBar: true,
        customClass: {
          container: "swal-high-z-index",
        },
      });
    } catch (err) {
      console.error("Failed to delete student:", err);

      Swal.fire({
        title: "Delete Failed",
        text:
          err.response?.data?.detail ||
          "Unable to delete this student. Please try again.",
        icon: "error",
        confirmButtonColor: "#DC2626",
        customClass: {
          container: "swal-high-z-index",
        },
      });
    }
  };
  console.log(ratings);
  return (
    <>
      <Sidebar />

      <main className="min-h-screen bg-[#F8FAFC] p-4 sm:p-6 lg:ml-72 lg:p-8">
        <div className="mx-auto max-w-[1600px]">
          <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-800">
                <Users size={24} />
              </div>

              <div>
                <h1 className="text-2xl font-bold text-gray-800">
                  Students List
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                  Review each student's strongest and least-performing reading
                  materials.
                </p>
              </div>
            </div>

            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              <button
                type="button"
                onClick={handleRefresh}
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:opacity-50"
              >
                <RefreshCw
                  size={17}
                  className={loading ? "animate-spin" : ""}
                />
                Refresh
              </button>

              <button
                type="button"
                onClick={() => setIsAddModalOpen(true)}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
              >
                <UserPlus size={17} />
                Add Student
              </button>
            </div>
          </div>

          {/* Summary */}
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Total Students
                  </p>
                  <p className="mt-2 text-2xl font-bold text-gray-800">
                    {students.length}
                  </p>
                </div>
                <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
                  <Users size={22} />
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Students With Ratings
                  </p>
                  <p className="mt-2 text-2xl font-bold text-gray-800">
                    {
                      students.filter(
                        (student) =>
                          getStudentPerformance(
                            student.id,
                            performanceByStudent,
                          ).materialsRated > 0,
                      ).length
                    }
                  </p>
                </div>
                <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600">
                  <Award size={22} />
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Rating Records
                  </p>
                  <p className="mt-2 text-2xl font-bold text-gray-800">
                    {ratings.length}
                  </p>
                </div>
                <div className="rounded-xl bg-amber-50 p-3 text-amber-600">
                  <BarChart3 size={22} />
                </div>
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <p className="text-sm text-gray-500">
              {students.length.toLocaleString()}{" "}
              {students.length === 1 ? "student account" : "student accounts"}
            </p>

            <div className="relative w-full sm:w-80">
              <Search
                size={18}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                type="text"
                placeholder="Search student..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-4 text-sm text-gray-700 shadow-sm outline-none transition placeholder:text-gray-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
          </div>

          {error && (
            <div
              role="alert"
              className="mb-5 flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between"
            >
              <p>{error}</p>
              <button
                type="button"
                onClick={handleRefresh}
                className="font-semibold underline underline-offset-2"
              >
                Try again
              </button>
            </div>
          )}

          {/* Student performance table */}
          <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-gray-100 bg-[#F8FAFC] text-xs font-semibold uppercase tracking-wider text-gray-600">
                    <th className="whitespace-nowrap px-6 py-4 sm:px-8">
                      Student
                    </th>

                    <th className="min-w-64 whitespace-nowrap px-6 py-4 text-center">
                      Best Material
                    </th>

                    <th className="min-w-64 whitespace-nowrap px-6 py-4 text-center">
                      Least Best Material
                    </th>

                    <th className="whitespace-nowrap px-6 py-4 text-center">
                      Performance
                    </th>

                    <th className="whitespace-nowrap px-6 py-4 text-center sm:px-8">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-50">
                  {loading && students.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-6 py-12 text-center text-sm text-gray-500"
                      >
                        Loading students and reading scores...
                      </td>
                    </tr>
                  ) : paginatedStudents.length > 0 ? (
                    paginatedStudents.map((student) => {
                      const performance = getStudentPerformance(
                        student.id,
                        performanceByStudent,
                      );

                      return (
                        <tr
                          key={student.id}
                          className="transition-colors hover:bg-emerald-50/30"
                        >
                          <td className="whitespace-nowrap px-6 py-4 sm:px-8">
                            <div className="flex items-center gap-3.5">
                              <div className="h-11 w-11 shrink-0 overflow-hidden rounded-full border-2 border-emerald-800 bg-emerald-100">
                                <img
                                  src={user}
                                  alt=""
                                  className="h-full w-full object-cover"
                                  loading="lazy"
                                />
                              </div>

                              <div>
                                <p className="text-sm font-semibold text-gray-800">
                                  {student.name}
                                </p>
                                <p className="mt-0.5 text-xs text-gray-400">
                                  {student.username || `ID: ${student.id}`}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="px-6 py-4 text-center">
                            <MaterialCell
                              material={performance.highest}
                              icon={Trophy}
                              variant="best"
                            />
                          </td>

                          <td className="px-6 py-4 text-center">
                            <MaterialCell
                              material={performance.lowest}
                              icon={BookOpen}
                              variant="least"
                            />
                          </td>

                          <td className="px-6 py-4 text-center">
                            <PerformanceCell
                              score={performance.highest?.score ?? null}
                            />
                          </td>

                          <td className="px-6 py-4 text-center sm:px-8">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                type="button"
                                title={`Edit ${student.name}`}
                                aria-label={`Edit ${student.name}`}
                                onClick={() => setStudentToEdit(student)}
                                className="inline-flex items-center justify-center rounded-xl border border-gray-200 p-2 text-gray-600 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
                              >
                                <Eye size={18} />
                              </button>

                              <button
                                type="button"
                                title={`Delete ${student.name}`}
                                aria-label={`Delete ${student.name}`}
                                onClick={() => handleDeleteStudent(student)}
                                className="inline-flex items-center justify-center rounded-xl border border-red-200 bg-white p-2 text-red-500 transition hover:border-red-300 hover:bg-red-50 hover:text-red-700"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-6 py-12 text-center text-sm text-gray-400"
                      >
                        {searchTerm
                          ? "No students match your search."
                          : "No students found. Add a student to get started."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex flex-col items-center justify-between gap-4 border-t border-gray-100 px-6 py-5 sm:flex-row sm:px-8">
              <p className="text-xs font-medium text-gray-500">
                Showing {firstEntry} to {lastEntry} of {filteredStudents.length}{" "}
                entries
              </p>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  aria-label="Previous page"
                  onClick={() =>
                    setCurrentPage((page) => Math.max(page - 1, 1))
                  }
                  disabled={safeCurrentPage <= 1}
                  className="rounded-xl border border-gray-200 p-2 text-gray-500 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft size={16} />
                </button>

                {Array.from({ length: totalPages }, (_, index) => index + 1)
                  .filter(
                    (page) =>
                      page === 1 ||
                      page === totalPages ||
                      Math.abs(page - safeCurrentPage) <= 1,
                  )
                  .reduce((result, page, index, pages) => {
                    if (index > 0 && page - pages[index - 1] > 1) {
                      result.push("ellipsis-" + page);
                    }

                    result.push(page);
                    return result;
                  }, [])
                  .map((page) =>
                    typeof page === "string" ? (
                      <span key={page} className="px-1 text-xs text-gray-400">
                        ...
                      </span>
                    ) : (
                      <button
                        key={page}
                        type="button"
                        onClick={() => setCurrentPage(page)}
                        aria-current={
                          page === safeCurrentPage ? "page" : undefined
                        }
                        className={`h-8 min-w-8 rounded-xl px-2 text-xs font-semibold transition-colors ${
                          page === safeCurrentPage
                            ? "border border-emerald-200 bg-emerald-100 text-emerald-800"
                            : "text-gray-600 hover:bg-gray-100"
                        }`}
                      >
                        {page}
                      </button>
                    ),
                  )}

                <button
                  type="button"
                  aria-label="Next page"
                  onClick={() =>
                    setCurrentPage((page) => Math.min(page + 1, totalPages))
                  }
                  disabled={safeCurrentPage >= totalPages}
                  className="rounded-xl border border-gray-200 p-2 text-gray-500 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>

          <p className="mt-4 text-xs leading-5 text-gray-400">
            Best material displays the highest individual rating recorded. Least
            best material displays the lowest individual rating recorded.
            Invalid scores outside 1–100 are excluded.
          </p>
        </div>
      </main>

      {isAddModalOpen && (
        <AddStudentModal
          onClose={() => setIsAddModalOpen(false)}
          onRefresh={handleRefresh}
        />
      )}

      {studentToEdit && (
        <EditStudentModal
          student={studentToEdit}
          onClose={() => setStudentToEdit(null)}
          onRefresh={handleRefresh}
        />
      )}
    </>
  );
};

export default Students;
