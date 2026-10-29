import React, { useCallback, useEffect, useMemo, useState } from "react";
import Chart from "react-apexcharts";
import { ChevronDown, RefreshCw, TrendingUp } from "lucide-react";
import api from "../../assets/api";

const RATINGS_API = "/api/ratings/";

const parseScore = (value) => {
  if (value === null || value === undefined || value === "") return null;

  const score = Number(String(value).trim().replace(/%$/, "").trim());

  return Number.isFinite(score) && score >= 0 && score <= 100 ? score : null;
};

const getStudentKey = (rating) => {
  const student = rating?.student;
  const id =
    student && typeof student === "object"
      ? (student.id ?? student.pk)
      : student;

  if (id !== null && id !== undefined && id !== "") {
    return String(id);
  }

  return rating?.student_name ?? rating?.student?.username ?? "Unknown Student";
};

const PerformanceOverview = () => {
  const [ratings, setRatings] = useState([]);
  const [period, setPeriod] = useState("thisMonth");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const fetchRatings = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);

    setError("");

    try {
      const response = await api.get(RATINGS_API);
      const data = response?.data;

      setRatings(
        Array.isArray(data)
          ? data
          : Array.isArray(data?.results)
            ? data.results
            : [],
      );
    } catch (err) {
      setError(
        err?.response?.data?.detail || "Unable to load performance data.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchRatings();
  }, [fetchRatings]);

  const filteredRatings = useMemo(() => {
    const now = new Date();
    let startDate;

    if (period === "thisMonth") {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (period === "lastMonth") {
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    } else {
      startDate = new Date(now.getFullYear(), 0, 1);
    }

    const endDate =
      period === "lastMonth"
        ? new Date(now.getFullYear(), now.getMonth(), 1)
        : new Date(now.getFullYear(), now.getMonth() + 1, 1);

    return ratings.filter((rating) => {
      if (!rating.created) return false;

      const date = new Date(rating.created);
      if (Number.isNaN(date.getTime())) return false;

      if (period === "thisYear") {
        return (
          date >= startDate && date < new Date(now.getFullYear() + 1, 0, 1)
        );
      }

      return date >= startDate && date < endDate;
    });
  }, [ratings, period]);

  const chartData = useMemo(() => {
    const grouped = new Map();

    filteredRatings.forEach((rating) => {
      const date = new Date(rating.created);
      const score = parseScore(rating.rate);

      if (score === null) return;

      const key = [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, "0"),
        String(date.getDate()).padStart(2, "0"),
      ].join("-");

      if (!grouped.has(key)) {
        grouped.set(key, {
          date: key,
          scores: [],
          students: new Set(),
          submissions: 0,
        });
      }

      const item = grouped.get(key);
      item.scores.push(score);
      item.students.add(getStudentKey(rating));
      item.submissions += 1;
    });

    return Array.from(grouped.values())
      .map((item) => ({
        date: item.date,
        average:
          item.scores.reduce((sum, score) => sum + score, 0) /
          item.scores.length,
        students: item.students.size,
        submissions: item.submissions,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [filteredRatings]);

  const averageRate = useMemo(() => {
    const scores = filteredRatings
      .map((rating) => parseScore(rating.rate))
      .filter((score) => score !== null);

    return scores.length
      ? scores.reduce((sum, score) => sum + score, 0) / scores.length
      : null;
  }, [filteredRatings]);

  const chartOptions = useMemo(
    () => ({
      chart: {
        type: "area",
        height: 240,
        fontFamily: "inherit",
        toolbar: { show: false },
        zoom: { enabled: false },
        animations: {
          enabled: true,
          easing: "easeinout",
          speed: 500,
        },
        foreColor: "#9CA3AF",
      },
      colors: ["#059669"],
      stroke: {
        curve: "smooth",
        width: 2.5,
        lineCap: "round",
      },
      fill: {
        type: "gradient",
        gradient: {
          shadeIntensity: 0.4,
          opacityFrom: 0.25,
          opacityTo: 0.02,
          stops: [0, 90, 100],
        },
      },
      markers: {
        size: chartData.length > 35 ? 0 : 4,
        strokeWidth: 2,
        strokeColors: "#FFFFFF",
        hover: { size: 7 },
      },
      dataLabels: { enabled: false },
      xaxis: {
        categories: chartData.map((item) => item.date),
        type: "category",
        axisBorder: { show: false },
        axisTicks: { show: false },
        labels: {
          rotate: -35,
          hideOverlappingLabels: true,
          trim: true,
          style: { fontSize: "10px" },
          formatter: (value) => {
            if (!value) return "";
            const date = new Date(`${value}T00:00:00`);
            return date.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            });
          },
        },
        tooltip: { enabled: false },
      },
      yaxis: {
        min: 0,
        max: 100,
        tickAmount: 4,
        labels: {
          formatter: (value) => `${Math.round(value)}%`,
          style: { fontSize: "10px" },
        },
      },
      grid: {
        borderColor: "#F1F5F9",
        strokeDashArray: 3,
        padding: { left: -8, right: 4 },
      },
      tooltip: {
        shared: false,
        intersect: false,
        x: {
          formatter: (value, { dataPointIndex }) => {
            const item = chartData[dataPointIndex];
            if (!item) return String(value);

            return new Date(`${item.date}T00:00:00`).toLocaleDateString(
              "en-US",
              {
                month: "long",
                day: "numeric",
                year: "numeric",
              },
            );
          },
        },
        y: {
          formatter: (value) => `${Number(value).toFixed(1)}%`,
          title: { formatter: () => "Average rate: " },
        },
      },
      noData: {
        text: "No assessment scores for this period",
        align: "center",
        verticalAlign: "middle",
        style: {
          color: "#9CA3AF",
          fontSize: "13px",
        },
      },
      responsive: [
        {
          breakpoint: 640,
          options: {
            chart: { height: 220 },
            xaxis: {
              labels: {
                rotate: -45,
                style: { fontSize: "9px" },
              },
            },
          },
        },
      ],
    }),
    [chartData],
  );

  return (
    <div className="flex min-w-0 flex-1 flex-col rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-800">
            Performance Overview
          </h2>
          <p className="mt-1 text-xs text-gray-500">
            Average reading assessment rate over time
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fetchRatings(true)}
            disabled={loading || refreshing}
            title="Refresh chart data"
            className="rounded-lg border border-gray-200 p-2 text-gray-500 transition hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
          </button>

          <div className="relative">
            <select
              value={period}
              onChange={(event) => setPeriod(event.target.value)}
              className="cursor-pointer appearance-none rounded-lg border border-gray-200 bg-gray-50 py-1.5 pl-3 pr-8 text-xs text-gray-600 outline-none focus:ring-1 focus:ring-emerald-500"
              aria-label="Select performance period"
            >
              <option value="thisMonth">This Month</option>
              <option value="lastMonth">Last Month</option>
              <option value="thisYear">This Year</option>
            </select>

            <ChevronDown
              size={14}
              className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400"
            />
          </div>
        </div>
      </div>

      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs text-gray-500">Average reading rate</p>
          <p className="mt-1 text-2xl font-bold text-gray-800">
            {loading
              ? "…"
              : averageRate === null
                ? "—"
                : `${averageRate.toFixed(1)}%`}
          </p>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-emerald-700">
          <TrendingUp size={14} />
          <span>{chartData.length} active day(s)</span>
        </div>
      </div>

      {error ? (
        <div className="flex min-h-[220px] flex-col items-center justify-center gap-3 text-center">
          <p className="text-sm text-red-600">{error}</p>
          <button
            type="button"
            onClick={() => fetchRatings()}
            className="rounded-lg bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-100"
          >
            Try again
          </button>
        </div>
      ) : loading ? (
        <div className="flex h-[240px] items-center justify-center">
          <RefreshCw size={20} className="animate-spin text-emerald-600" />
          <span className="ml-2 text-sm text-gray-500">
            Loading performance data...
          </span>
        </div>
      ) : (
        <div className="min-h-0 w-full">
          <Chart
            options={chartOptions}
            series={[
              {
                name: "Average Rate",
                data: chartData.map((item) => Number(item.average.toFixed(2))),
              },
            ]}
            type="area"
            height={240}
            width="100%"
          />
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 pt-3 text-xs text-gray-400">
        <span>
          {filteredRatings.length} assessment record
          {filteredRatings.length === 1 ? "" : "s"} in selected period
        </span>
        <span>Daily average of valid scores</span>
      </div>
    </div>
  );
};

export default PerformanceOverview;
