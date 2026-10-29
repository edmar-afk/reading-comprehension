/* eslint-disable no-unused-vars */
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Search, FileText, BookOpen, Users, RefreshCw } from "lucide-react";
import SideBar from "../components/sidebar/SideBar";
import AddReadingMaterialModal from "../components/readingmaterials/AddReadingMaterialModal";
import api from "../assets/api";
import { Link } from "react-router-dom";

const getMaterialStyle = (difficulty) => {
  const level = String(difficulty || "Easy").toLowerCase();

  if (level === "easy") {
    return {
      badge: "bg-emerald-100 text-emerald-700",
      accent: "border-l-emerald-500",
    };
  }

  if (level === "medium") {
    return {
      badge: "bg-amber-100 text-amber-700",
      accent: "border-l-amber-500",
    };
  }

  if (level === "hard") {
    return {
      badge: "bg-rose-100 text-rose-700",
      accent: "border-l-rose-500",
    };
  }

  return {
    badge: "bg-gray-100 text-gray-700",
    accent: "border-l-gray-400",
  };
};

const ReadingMaterials = () => {
  const [materials, setMaterials] = useState([]);
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Fetch the latest reading materials from Django.
  const fetchMaterials = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/api/reading-materials/");

      // Supports either a regular array or Django REST Framework pagination.
      const data = Array.isArray(response.data)
        ? response.data
        : Array.isArray(response.data?.results)
          ? response.data.results
          : [];

      setMaterials(data);
    } catch (err) {
      console.error("Failed to fetch reading materials:", err);
      setError(
        err.response?.data?.detail ||
          "Unable to load reading materials. Please check your Django server and API URL.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMaterials();
  }, [fetchMaterials]);

  // Format API data for the material cards.
  const formattedMaterials = useMemo(() => {
    return materials.map((item) => {
      const difficulty = item.difficulty || "Easy";
      const style = getMaterialStyle(difficulty);

      // Prefer the backend word_count; otherwise count words locally.
      const wordCount =
        typeof item.word_count === "number"
          ? item.word_count
          : String(item.content || "").trim()
            ? String(item.content).trim().split(/\s+/).length
            : 0;

      return {
        ...item,
        id: item.id,
        title: item.title || "Untitled Material",
        description: item.content || "",
        difficulty,
        studentCount: Number(item.student_count ?? 0),
        wordCount,
        ...style,
      };
    });
  }, [materials]);

  // Search by title, content, or difficulty.
  const filteredMaterials = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return formattedMaterials.filter((item) => {
      const matchesSearch =
        !query ||
        item.title.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query) ||
        item.difficulty.toLowerCase().includes(query);

      // Assigned currently displays all materials because the supplied
      // ReadingMaterials model has no assignment field.
      const matchesTab = activeTab === "all" || activeTab === "assigned";

      return matchesSearch && matchesTab;
    });
  }, [formattedMaterials, searchQuery, activeTab]);

  const totalStudents = useMemo(() => {
    return formattedMaterials.reduce(
      (total, item) => total + item.studentCount,
      0,
    );
  }, [formattedMaterials]);

  // Called after the separate modal successfully saves a material.
  const handleMaterialSaved = async () => {
    setIsAddModalOpen(false);
    await fetchMaterials();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <SideBar />

      <main className="min-h-screen px-4 py-6 sm:px-6 lg:ml-64 lg:px-8">
        <div className="mx-auto max-w-7xl">
          {/* Header */}
          <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                Reading Materials
              </h1>
              <p className="mt-2 text-sm text-gray-500 sm:text-base">
                Manage reading passages and track student challenges.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={fetchMaterials}
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
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
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
              >
                <FileText size={18} />
                Add Material
              </button>
            </div>
          </div>

          {/* Summary cards */}
          <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <BookOpen size={23} />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Total Materials
                  </p>
                  <p className="mt-1 text-2xl font-bold text-gray-900">
                    {formattedMaterials.length}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <Users size={23} />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Recorded Student Challenges
                  </p>
                  <p className="mt-1 text-2xl font-bold text-gray-900">
                    {totalStudents.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Search and tabs */}
          <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div className="relative w-full">
              <Search
                size={19}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search reading materials..."
                className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-11 pr-4 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div
              role="alert"
              className="mb-6 flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between"
            >
              <p>{error}</p>
              <button
                type="button"
                onClick={fetchMaterials}
                className="shrink-0 font-semibold underline underline-offset-2"
              >
                Try again
              </button>
            </div>
          )}

          {/* Loading state */}
          {loading && materials.length === 0 && (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
              {[1, 2, 3].map((number) => (
                <div
                  key={number}
                  className="animate-pulse rounded-2xl border border-gray-100 bg-white p-6"
                >
                  <div className="mb-4 h-5 w-2/3 rounded bg-gray-200" />
                  <div className="mb-2 h-4 w-full rounded bg-gray-100" />
                  <div className="mb-6 h-4 w-4/5 rounded bg-gray-100" />
                  <div className="h-16 rounded bg-gray-100" />
                </div>
              ))}
            </div>
          )}

          {/* Material cards */}
          {(!loading || materials.length > 0) && (
            <>
              {filteredMaterials.length > 0 ? (
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                  {filteredMaterials.map((item) => (
                    <Link
                      key={item.id}
                      to={`/start-reading/${item.id}`}
                      className={`flex min-h-[280px] flex-col rounded-2xl border border-gray-100 border-l-4 ${item.accent} bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-emerald-500 sm:p-6`}
                    >
                      <div className="mb-4 flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-start gap-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gray-50 text-emerald-600">
                            <FileText size={21} />
                          </div>

                          <div className="min-w-0">
                            <h2 className="break-words text-lg font-bold text-gray-900">
                              {item.title}
                            </h2>

                            <p className="mt-1 text-xs text-gray-400">
                              {item.date_added
                                ? `Added ${new Date(
                                    item.date_added,
                                  ).toLocaleDateString()}`
                                : "Reading material"}
                            </p>
                          </div>
                        </div>

                        <span
                          className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold capitalize ${item.badge}`}
                        >
                          {item.difficulty}
                        </span>
                      </div>

                      <p className="mb-6 line-clamp-4 whitespace-pre-line break-words text-sm leading-6 text-gray-600">
                        {item.description || "No reading content available."}
                      </p>

                      <div className="mt-auto grid grid-cols-2 gap-3 border-t border-gray-100 pt-4">
                        <div className="min-w-0">
                          <div className="mb-1 flex items-center gap-1.5 text-gray-500">
                            <Users size={15} />
                            <span className="text-xs font-medium">
                              Student challenges
                            </span>
                          </div>

                          <p className="text-sm font-bold text-emerald-700">
                            {item.studentCount.toLocaleString()}{" "}
                            {item.studentCount === 1 ? "student" : "students"}
                          </p>
                        </div>

                        <div className="min-w-0 text-right">
                          <div className="mb-1 flex items-center justify-end gap-1.5 text-gray-500">
                            <FileText size={15} />
                            <span className="text-xs font-medium">
                              Reading length
                            </span>
                          </div>

                          <p className="text-sm font-bold text-gray-800">
                            {item.wordCount.toLocaleString()}{" "}
                            {item.wordCount === 1 ? "word" : "words"}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-gray-400">
                    <BookOpen size={27} />
                  </div>

                  <h3 className="text-lg font-bold text-gray-900">
                    {searchQuery
                      ? "No matching materials"
                      : "No reading materials yet"}
                  </h3>

                  <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
                    {searchQuery
                      ? "Try another search term."
                      : "Add your first reading material to get started."}
                  </p>

                  {!searchQuery && (
                    <button
                      type="button"
                      onClick={() => setIsAddModalOpen(true)}
                      className="mt-5 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
                    >
                      Add Reading Material
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Separate add-material modal */}
      {isAddModalOpen && (
        <AddReadingMaterialModal
          onClose={() => setIsAddModalOpen(false)}
          onSaved={handleMaterialSaved}
        />
      )}
    </div>
  );
};

export default ReadingMaterials;
