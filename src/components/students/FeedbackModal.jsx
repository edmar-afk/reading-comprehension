import React, { useEffect, useMemo, useState } from "react";
import {
  X,
  MessageSquareText,
  BookOpen,
  CalendarDays,
  UserRound,
  Brain,
  LoaderCircle,
  AlertCircle,
  CheckCircle2,
  Star,
} from "lucide-react";

import api from "../../assets/api";

// ============================================
// DATE FORMATTER
// ============================================
const formatDate = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

// ============================================
// GET STUDENT ID
// ============================================
const getStudentId = (student, material) => {
  return Number(
    material?.student ??
      student?.id ??
      student?.student?.id ??
      student?.student
  );
};

// ============================================
// GET READING MATERIAL ID
// ============================================
const getMaterialId = (material) => {
  const value =
    material?.material_title?.id ??
    material?.material_title ??
    material?.reading_material_id ??
    material?.id;

  return Number(value);
};

// ============================================
// MATCH DATE TO THE SAME UTC MINUTE
// ============================================
const isSameDateAndMinute = (ratingDateValue, quizDateValue) => {
  if (!ratingDateValue || !quizDateValue) return false;

  const ratingDate = new Date(ratingDateValue);
  const quizDate = new Date(quizDateValue);

  if (
    Number.isNaN(ratingDate.getTime()) ||
    Number.isNaN(quizDate.getTime())
  ) {
    return false;
  }

  return (
    ratingDate.getUTCFullYear() === quizDate.getUTCFullYear() &&
    ratingDate.getUTCMonth() === quizDate.getUTCMonth() &&
    ratingDate.getUTCDate() === quizDate.getUTCDate() &&
    ratingDate.getUTCHours() === quizDate.getUTCHours() &&
    ratingDate.getUTCMinutes() === quizDate.getUTCMinutes()
  );
};

// ============================================
// GET QUIZ RESULT STUDENT ID
// ============================================
const getResultStudentId = (result) => {
  const value =
    result?.student?.id ??
    result?.student_id ??
    result?.student;

  return Number(value);
};

// ============================================
// GET QUIZ RESULT MATERIAL ID
// ============================================
const getResultMaterialId = (result) => {
  const value =
    result?.reading_material_id ??
    result?.quiz?.reading_material_id ??
    result?.quiz?.reading_material?.id ??
    result?.quiz?.reading_material;

  return Number(value);
};

// ============================================
// SCORE HELPERS
// ============================================
const getPercentage = (result) => {
  const score = Number(result?.score ?? 0);
  const total = Number(result?.total_questions ?? 0);

  if (!total || total < 0) return 0;

  return Math.round((score / total) * 100);
};

const getScoreColor = (percentage) => {
  if (percentage >= 90) return "text-emerald-600";
  if (percentage >= 75) return "text-blue-600";
  if (percentage >= 60) return "text-amber-600";

  return "text-red-600";
};

const getProgressColor = (percentage) => {
  if (percentage >= 90) return "bg-emerald-500";
  if (percentage >= 75) return "bg-blue-500";
  if (percentage >= 60) return "bg-amber-500";

  return "bg-red-500";
};

const getPerformanceLabel = (percentage) => {
  if (percentage === 100) return "Perfect Score";
  if (percentage >= 90) return "Excellent";
  if (percentage >= 75) return "Very Good";
  if (percentage >= 60) return "Good";
  if (percentage >= 40) return "Needs Improvement";

  return "Needs More Practice";
};

// ============================================
// COMPONENT
// ============================================
const FeedbackModal = ({ student, material, onClose }) => {
  const [quizResults, setQuizResults] = useState([]);
  const [loadingQuizzes, setLoadingQuizzes] = useState(true);
  const [quizError, setQuizError] = useState("");

  const studentId = getStudentId(student, material);
  const materialId = getMaterialId(material);

  // ============================================
  // FETCH AND MATCH QUIZ RESULTS
  // ============================================
  useEffect(() => {
    let isMounted = true;

    const fetchQuizResults = async () => {
      if (
        !studentId ||
        !materialId ||
        !material?.created
      ) {
        setQuizResults([]);
        setLoadingQuizzes(false);
        return;
      }

      setLoadingQuizzes(true);
      setQuizError("");

      try {
        const response = await api.get("/api/quiz-results/");

        const allResults = Array.isArray(response.data)
          ? response.data
          : Array.isArray(response.data?.results)
            ? response.data.results
            : [];

        const matchingResults = allResults.filter((result) => {
          const resultStudentId = getResultStudentId(result);
          const resultMaterialId = getResultMaterialId(result);

          const sameStudent = resultStudentId === studentId;
          const sameMaterial = resultMaterialId === materialId;

          const sameMinute = isSameDateAndMinute(
            material.created,
            result.date_taken
          );

          return sameStudent && sameMaterial && sameMinute;
        });

        matchingResults.sort(
          (a, b) =>
            new Date(b.date_taken).getTime() -
            new Date(a.date_taken).getTime()
        );

        if (isMounted) {
          setQuizResults(matchingResults);
        }
      } catch (error) {
        console.error("Failed to fetch quiz results:", error);

        if (isMounted) {
          setQuizError("Unable to load the comprehension quiz results.");
          setQuizResults([]);
        }
      } finally {
        if (isMounted) {
          setLoadingQuizzes(false);
        }
      }
    };

    fetchQuizResults();

    return () => {
      isMounted = false;
    };
  }, [studentId, materialId, material?.created]);

  // ============================================
  // ESCAPE KEY
  // ============================================
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  // ============================================
  // DISPLAY VALUES
  // ============================================
  const studentName =
    student?.name ||
    student?.first_name ||
    "Unnamed Student";

  const materialTitle =
    material?.title ||
    "Untitled Reading Material";

  const readingRate =
    material?.rate ??
    material?.score ??
    "—";

  const readingFeedback =
    material?.feedback ||
    "No reading feedback provided.";

  const ratingDate = material?.created;

  const formattedQuizResults = useMemo(() => {
    return quizResults.map((result) => ({
      ...result,
      percentage: getPercentage(result),
    }));
  }, [quizResults]);

  // ============================================
  // UI
  // ============================================
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-3 backdrop-blur-sm sm:p-5"
      onClick={onClose}
    >
      <div
        className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-gray-100 bg-white px-5 py-4 sm:px-6">
          <div>
            <h2 className="text-lg font-bold text-gray-800">
              Student Assessment Details
            </h2>

            <p className="mt-1 text-xs text-gray-400">
              Reading rating and comprehension quiz results
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>

        {/* CONTENT */}
        <div className="flex-1 space-y-5 overflow-y-auto p-5 sm:p-6">

          {/* STUDENT INFORMATION */}
          <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 p-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <UserRound size={21} />
            </div>

            <div className="min-w-0">
              <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">
                Student
              </p>

              <h3 className="truncate text-sm font-bold text-gray-800">
                {studentName}
              </h3>
            </div>
          </div>

          {/* READING MATERIAL */}
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
              <BookOpen size={19} />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">
                Reading Material
              </p>

              <h3 className="mt-1 text-sm font-bold text-gray-800">
                {materialTitle}
              </h3>

              <p className="mt-1 flex items-center gap-1.5 text-xs text-gray-400">
                <CalendarDays size={13} />
                Submitted: {formatDate(ratingDate)}
              </p>
            </div>
          </div>

          {/* READING RATING */}
          <section className="overflow-hidden rounded-xl border border-emerald-100">
            <div className="flex items-center gap-2 border-b border-emerald-100 bg-emerald-50 px-4 py-3">
              <Star size={17} className="text-emerald-600" />

              <h3 className="text-sm font-bold text-emerald-800">
                Reading Assessment Rating
              </h3>
            </div>

            <div className="space-y-4 p-4">
              <div>
                <p className="text-xs font-medium text-gray-400">
                  Reading Score / Rating
                </p>

                <p className="mt-1 text-2xl font-bold text-emerald-600">
                  {readingRate}
                  {typeof readingRate === "number" ? "%" : ""}
                </p>
              </div>

              <div>
                <p className="mb-2 flex items-center gap-2 text-xs font-semibold text-gray-600">
                  <MessageSquareText size={14} />
                  Reading Feedback
                </p>

                <p className="rounded-lg bg-gray-50 p-3 text-sm leading-6 text-gray-600">
                  {readingFeedback}
                </p>
              </div>
            </div>
          </section>

          {/* COMPREHENSION QUIZ RESULTS */}
          <section className="overflow-hidden rounded-xl border border-purple-100">
            <div className="flex items-center justify-between border-b border-purple-100 bg-purple-50 px-4 py-3">
              <div className="flex items-center gap-2">
                <Brain size={18} className="text-purple-600" />

                <h3 className="text-sm font-bold text-purple-800">
                  Associated Comprehension Quiz
                </h3>
              </div>

              {!loadingQuizzes && (
                <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-purple-700">
                  {quizResults.length} result
                  {quizResults.length === 1 ? "" : "s"}
                </span>
              )}
            </div>

            <div className="space-y-4 p-4">
              {loadingQuizzes ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <LoaderCircle
                    size={25}
                    className="animate-spin text-purple-600"
                  />

                  <p className="mt-3 text-sm text-gray-500">
                    Loading comprehension quiz results...
                  </p>
                </div>
              ) : quizError ? (
                <div className="flex items-center gap-2 rounded-lg bg-red-50 p-4 text-sm text-red-600">
                  <AlertCircle size={18} className="shrink-0" />
                  {quizError}
                </div>
              ) : formattedQuizResults.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-lg bg-gray-50 px-4 py-8 text-center">
                  <div className="rounded-full bg-purple-100 p-3 text-purple-600">
                    <Brain size={23} />
                  </div>

                  <p className="mt-3 text-sm font-semibold text-gray-700">
                    No matching quiz result found
                  </p>

                  <p className="mt-1 max-w-sm text-xs leading-5 text-gray-400">
                    No comprehension quiz result was found for this student
                    and reading material within the same date and minute as
                    this reading assessment.
                  </p>
                </div>
              ) : (
                formattedQuizResults.map((result, index) => (
                  <div
                    key={result.id}
                    className="rounded-xl border border-gray-100 bg-white p-4"
                  >
                    {/* QUIZ TITLE */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">
                          Comprehension Quiz {index + 1}
                        </p>

                        <h4 className="mt-1 text-sm font-bold text-gray-800">
                          {result.quiz_title || "Reading Comprehension Quiz"}
                        </h4>

                        <p className="mt-1 text-xs text-gray-400">
                          {formatDate(result.date_taken)}
                        </p>
                      </div>

                      <CheckCircle2
                        size={19}
                        className="shrink-0 text-emerald-500"
                      />
                    </div>

                    {/* QUIZ SCORE */}
                    <div className="mt-4 rounded-lg bg-gray-50 p-3">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-xs text-gray-400">
                            Quiz Score
                          </p>

                          <p className="mt-1 text-lg font-bold text-gray-800">
                            {result.score}{" "}
                            <span className="text-sm font-medium text-gray-400">
                              / {result.total_questions}
                            </span>
                          </p>
                        </div>

                        <div className="text-right">
                          <p className="text-xs text-gray-400">
                            Percentage
                          </p>

                          <p
                            className={`mt-1 text-xl font-bold ${getScoreColor(
                              result.percentage
                            )}`}
                          >
                            {result.percentage}%
                          </p>
                        </div>
                      </div>

                      {/* PROGRESS BAR */}
                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-200">
                        <div
                          className={`h-full rounded-full transition-all ${getProgressColor(
                            result.percentage
                          )}`}
                          style={{
                            width: `${Math.min(
                              Math.max(result.percentage, 0),
                              100
                            )}%`,
                          }}
                        />
                      </div>

                      <p
                        className={`mt-2 text-right text-xs font-semibold ${getScoreColor(
                          result.percentage
                        )}`}
                      >
                        {getPerformanceLabel(result.percentage)}
                      </p>
                    </div>

                    {/* QUIZ FEEDBACK */}
                    <div className="mt-4">
                      <p className="mb-2 flex items-center gap-2 text-xs font-semibold text-gray-600">
                        <MessageSquareText size={14} />
                        Quiz Feedback
                      </p>

                      <p className="rounded-lg bg-purple-50 p-3 text-sm leading-6 text-gray-600">
                        {result.feedback ||
                          "No comprehension quiz feedback available."}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        {/* FOOTER */}
        <div className="border-t border-gray-100 bg-white px-5 py-4 sm:px-6">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default FeedbackModal;