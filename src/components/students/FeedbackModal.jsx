import React, { useEffect } from "react";
import {
  X,
  MessageSquareText,
  BookOpen,
  CalendarDays,
  UserRound,
} from "lucide-react";

const formatDate = (value) => {
  if (!value) return "Date unavailable";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Date unavailable";

  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const FeedbackModal = ({ student, material, onClose }) => {
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  if (!student || !material) return null;

  return (
    <div
      className="fixed inset-0 z-[999999] flex items-center justify-center bg-gray-950/50 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="feedback-modal-title"
        className="flex h-[500px] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        {/* Fixed header */}
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-gray-100 px-6 py-5">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-emerald-50 p-3 text-emerald-700">
              <MessageSquareText size={22} />
            </div>

            <div className="min-w-0">
              <h2
                id="feedback-modal-title"
                className="text-lg font-bold text-gray-800"
              >
                Reading Feedback
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Feedback from this student's rating
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close feedback modal"
            className="shrink-0 rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain px-6 py-6">
          <div className="flex items-start gap-3">
            <UserRound
              size={18}
              className="mt-0.5 shrink-0 text-gray-400"
            />

            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                Student
              </p>

              <p className="mt-1 break-words text-sm font-semibold text-gray-800">
                {student.name || student.username || "Unnamed Student"}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <BookOpen
              size={18}
              className="mt-0.5 shrink-0 text-gray-400"
            />

            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                Reading Material
              </p>

              <p className="mt-1 break-words text-sm font-semibold text-gray-800">
                {material.title || "Untitled material"}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-4 rounded-xl bg-gray-50 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500">Rating</p>

              <p className="mt-1 text-2xl font-bold text-emerald-700">
                {material.score === null || material.score === undefined
                  ? "—"
                  : `${Number(material.score.toFixed(2))}%`}
              </p>
            </div>

            <div className="min-w-0 sm:text-right">
              <p className="text-xs font-medium text-gray-500">Rated on</p>

              <div className="mt-1 flex items-start gap-1.5 text-sm text-gray-700 sm:justify-end">
                <CalendarDays
                  size={15}
                  className="mt-0.5 shrink-0 text-gray-400"
                />

                <span className="break-words">
                  {formatDate(material.created)}
                </span>
              </div>
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-semibold text-gray-800">
              Student Feedback
            </p>

            <div className="min-h-28 whitespace-pre-wrap break-words [overflow-wrap:anywhere] rounded-xl border border-gray-200 bg-white p-4 text-sm leading-6 text-gray-700">
              {material.feedback?.trim()
                ? material.feedback
                : "No feedback was provided for this rating."}
            </div>
          </div>
        </div>

        {/* Fixed footer */}
        <div className="flex shrink-0 justify-end border-t border-gray-100 bg-gray-50 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default FeedbackModal;
