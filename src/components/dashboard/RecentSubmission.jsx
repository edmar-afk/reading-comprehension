import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BookOpen,
  CalendarDays,
  ChevronRight,
  RefreshCw,
  Users,
} from "lucide-react";

import api from "../../assets/api";

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
  const navigate = useNavigate();

  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  const recentSubmissions = ratings.slice(0, MAX_SUBMISSIONS);

  return (
    <div className="flex-1 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-800">
            Recent Submissions
          </h2>
          <p className="mt-1 text-xs text-gray-400">
            Latest student reading assessments
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchRatings}
            disabled={loading}
            title="Refresh submissions"
            aria-label="Refresh submissions"
            className="rounded-lg border border-gray-200 p-2 text-gray-500 transition hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          </button>

          <button
            type="button"
            onClick={() => navigate("/analytics")}
            className="inline-flex items-center gap-1 text-xs font-semibold text-gray-500 transition-colors hover:text-emerald-700"
          >
            View All
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

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
            <Users size={23} />
          </div>
          <p className="text-sm font-semibold text-gray-600">
            No submissions yet
          </p>
          <p className="mt-1 text-xs text-gray-400">
            Student reading assessments will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {recentSubmissions.map((sub) => {
            const name = sub._name || "Unnamed Student";
            const avatarSeed = encodeURIComponent(name);

            return (
              <div
                key={sub._key}
                className="flex flex-col gap-3 border-b border-gray-50 pb-4 last:border-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
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

                  <div className="min-w-0">
                    <h4 className="truncate text-sm font-semibold text-gray-800">
                      {name}
                    </h4>

                    <div className="mt-1 flex items-start gap-1.5">
                      <BookOpen
                        size={13}
                        className="mt-0.5 shrink-0 text-emerald-600"
                      />
                      <p
                        title={sub._material}
                        className="line-clamp-2 text-xs leading-5 text-gray-500"
                      > Took the {sub._material} Challenge
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex shrink-0 items-center justify-between gap-4 sm:flex-col sm:items-end sm:gap-1">
                  <span
                    className={`text-sm font-bold ${getScoreColor(sub._score)}`}
                  > Score: 
                    {formatScore(sub._score)}
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

      {!loading && ratings.length > MAX_SUBMISSIONS && (
        <button
          type="button"
          onClick={() => navigate("/analytics")}
          className="mt-5 w-full rounded-xl border border-gray-100 bg-gray-50 py-2.5 text-xs font-semibold text-gray-600 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
        >
          View all {ratings.length} assessment records
        </button>
      )}
    </div>
  );
};

export default RecentSubmissions;
