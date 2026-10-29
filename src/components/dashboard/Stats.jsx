import React, { useCallback, useEffect, useState } from "react";
import { Users, BookOpen, Star, RefreshCw } from "lucide-react";
import api from "../../assets/api";

const API_ENDPOINTS = {
  students: "/api/users/",
  materials: "/api/reading-materials/",
  ratings: "/api/ratings/",
};

const getList = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  return [];
};

const parseRate = (rate) => {
  if (rate === null || rate === undefined || rate === "") return null;

  const value = Number(String(rate).trim().replace(/%$/, "").trim());

  return Number.isFinite(value) && value >= 0 && value <= 100
    ? value
    : null;
};

const statConfig = [
  {
    id: "students",
    title: "Total Students",
    icon: Users,
    bgColor: "bg-emerald-50",
    iconColor: "text-emerald-700",
  },
  {
    id: "materials",
    title: "Reading Materials",
    icon: BookOpen,
    bgColor: "bg-emerald-50",
    iconColor: "text-emerald-700",
  },
  {
    id: "ratings",
    title: "Total Ratings",
    icon: Star,
    bgColor: "bg-emerald-50",
    iconColor: "text-amber-500",
  },
  {
    id: "average",
    title: "Avg. Score",
    icon: Star,
    bgColor: "bg-emerald-50",
    iconColor: "text-emerald-700",
  },
];

const Stats = () => {
  const [stats, setStats] = useState({
    students: 0,
    materials: 0,
    ratings: 0,
    average: null,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [studentsResponse, materialsResponse, ratingsResponse] =
        await Promise.all([
          api.get(API_ENDPOINTS.students),
          api.get(API_ENDPOINTS.materials),
          api.get(API_ENDPOINTS.ratings),
        ]);

      const students = getList(studentsResponse.data);
      const materials = getList(materialsResponse.data);
      const ratings = getList(ratingsResponse.data);

      const validRates = ratings
        .map((rating) => parseRate(rating.rate))
        .filter((rate) => rate !== null);

      const average =
        validRates.length > 0
          ? validRates.reduce((total, rate) => total + rate, 0) /
            validRates.length
          : null;

      setStats({
        students: students.length,
        materials: materials.length,
        ratings: ratings.length,
        average,
      });
    } catch (err) {
      console.error("Failed to fetch dashboard statistics:", err);
      setError("Unable to load statistics. Check your API endpoints.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const values = {
    students: stats.students.toLocaleString(),
    materials: stats.materials.toLocaleString(),
    ratings: stats.ratings.toLocaleString(),
    average:
      stats.average === null ? "—" : `${stats.average.toFixed(1)}%`,
  };

  return (
    <div className="mb-6">
      {error && (
        <div className="mb-3 flex items-center justify-between gap-3 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
          <span>{error}</span>
          <button
            type="button"
            onClick={fetchStats}
            className="font-semibold hover:underline"
          >
            Retry
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statConfig.map((item) => {
          const IconComponent = item.icon;

          return (
            <div
              key={item.id}
              className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
            >
              <div
                className={`rounded-xl p-3.5 ${item.bgColor} ${item.iconColor}`}
              >
                <IconComponent size={24} />
              </div>

              <div className="min-w-0">
                <p className="text-xs font-medium text-gray-500">
                  {item.title}
                </p>

                <h3 className="mt-1 text-2xl font-bold text-gray-800">
                  {loading ? (
                    <RefreshCw
                      size={20}
                      className="animate-spin text-emerald-600"
                    />
                  ) : (
                    values[item.id]
                  )}
                </h3>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Stats;
