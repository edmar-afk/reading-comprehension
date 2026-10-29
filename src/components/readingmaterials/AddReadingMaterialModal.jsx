/* eslint-disable no-unused-vars */
import React, { useState } from "react";
import {
  BookOpen,
  Plus,
  X,
  Feather,
  GraduationCap,
  Check,
  AlignLeft,
  AlertCircle,
  LoaderCircle,
} from "lucide-react";
import api from "../../assets/api";

const difficultyOptions = [
  {
    value: "Easy",
    description: "Simple words and short sentences",
    icon: Feather,
    color: "emerald",
  },
  {
    value: "Medium",
    description: "Balanced vocabulary and complexity",
    icon: BookOpen,
    color: "amber",
  },
  {
    value: "Hard",
    description: "Advanced vocabulary and ideas",
    icon: GraduationCap,
    color: "rose",
  },
];

const AddReadingMaterialModal = ({ isOpen, onClose, onSaved }) => {
  const [title, setTitle] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [passage, setPassage] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const wordCount = passage.trim() ? passage.trim().split(/\s+/).length : 0;

  const characterCount = passage.trim().length;

  const isValid =
    title.trim().length > 0 && difficulty !== "" && characterCount >= 50;

  const resetForm = () => {
    setTitle("");
    setDifficulty("");
    setPassage("");
    setError("");
  };

  const handleClose = () => {
    if (saving) return;
    resetForm();
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isValid || saving) return;

    setSaving(true);
    setError("");

    try {
      const response = await api.post("/api/reading-materials/", {
        title: title.trim(),
        difficulty,
        content: passage.trim(),
      });

      // Refresh the materials list after saving.
      if (onSaved) {
        await onSaved();
      }

      resetForm();
      onClose();
    } catch (err) {
      const data = err.response?.data;

      const detail =
        data?.detail ||
        data?.error ||
        (data
          ? Object.entries(data)
              .map(([key, value]) => {
                const message = Array.isArray(value)
                  ? value.join(", ")
                  : typeof value === "string"
                    ? value
                    : JSON.stringify(value);

                return `${key}: ${message}`;
              })
              .join("\n")
          : err.message);

      setError(detail || "Unable to save reading material. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const styles = {
    Easy: {
      selected: "border-emerald-500 bg-emerald-50 ring-2 ring-emerald-500/10",
      icon: "bg-emerald-100 text-emerald-700",
      dot: "border-emerald-600 bg-emerald-600",
      text: "text-emerald-700",
    },
    Medium: {
      selected: "border-amber-500 bg-amber-50 ring-2 ring-amber-500/10",
      icon: "bg-amber-100 text-amber-700",
      dot: "border-amber-500 bg-amber-500",
      text: "text-amber-700",
    },
    Hard: {
      selected: "border-rose-500 bg-rose-50 ring-2 ring-rose-500/10",
      icon: "bg-rose-100 text-rose-700",
      dot: "border-rose-500 bg-rose-500",
      text: "text-rose-700",
    },
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4 backdrop-blur-sm sm:p-6"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-material-title"
        className="my-auto w-full max-w-2xl overflow-hidden rounded-3xl border border-white bg-white shadow-2xl"
      >
        {/* Header */}
        <div className="relative overflow-hidden border-b border-gray-100 bg-gradient-to-br from-emerald-50 via-white to-teal-50 px-6 py-6 sm:px-8">
          <div className="absolute -right-8 -top-12 h-36 w-36 rounded-full bg-emerald-100/50 blur-2xl" />

          <div className="relative flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg">
                <BookOpen size={23} />
              </div>

              <div>
                <h2
                  id="add-material-title"
                  className="text-xl font-bold tracking-tight text-gray-900"
                >
                  Add Reading Material
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Create a new reading passage for your learners.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleClose}
              disabled={saving}
              aria-label="Close modal"
              className="rounded-xl p-2 text-gray-400 transition hover:bg-white hover:text-gray-700 disabled:opacity-40"
            >
              <X size={20} />
            </button>
          </div>

          <p className="relative mt-5 text-xs font-medium text-emerald-700">
            <span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
            All fields are required
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="max-h-[60vh] space-y-6 overflow-y-auto px-6 py-6 sm:px-8">
            {/* Title */}
            <div>
              <label
                htmlFor="material-title"
                className="mb-2 block text-sm font-semibold text-gray-800"
              >
                Material Title <span className="text-rose-500">*</span>
              </label>

              <input
                id="material-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. The Benefits of Daily Reading"
                maxLength={120}
                required
                disabled={saving}
                className="w-full rounded-xl border border-gray-200 bg-gray-50/70 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
              />

              <div className="mt-1.5 flex justify-between text-xs text-gray-400">
                <span>Choose a descriptive title.</span>
                <span>{title.length}/120</span>
              </div>
            </div>

            {/* Difficulty */}
            <fieldset>
              <legend className="mb-3 text-sm font-semibold text-gray-800">
                Reading Difficulty <span className="text-rose-500">*</span>
              </legend>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {difficultyOptions.map((option) => {
                  const Icon = option.icon;
                  const selected = difficulty === option.value;
                  const style = styles[option.value];

                  return (
                    <label
                      key={option.value}
                      className={`flex cursor-pointer flex-col rounded-2xl border p-4 transition-all hover:shadow-sm ${
                        selected
                          ? style.selected
                          : "border-gray-200 bg-white hover:border-gray-300"
                      } ${saving ? "pointer-events-none opacity-60" : ""}`}
                    >
                      <input
                        type="radio"
                        name="difficulty"
                        value={option.value}
                        checked={selected}
                        onChange={() => setDifficulty(option.value)}
                        disabled={saving}
                        className="sr-only"
                      />

                      <div className="mb-3 flex items-center justify-between">
                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                            selected ? style.icon : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          <Icon size={20} />
                        </div>

                        <span
                          className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                            selected ? style.dot : "border-gray-300 bg-white"
                          }`}
                        >
                          {selected && (
                            <Check size={12} className="text-white" />
                          )}
                        </span>
                      </div>

                      <span
                        className={`text-sm font-bold ${
                          selected ? style.text : "text-gray-800"
                        }`}
                      >
                        {option.value}
                      </span>

                      <span className="mt-1 text-xs leading-relaxed text-gray-500">
                        {option.description}
                      </span>
                    </label>
                  );
                })}
              </div>
            </fieldset>

            {/* Passage */}
            <div>
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <label
                  htmlFor="material-passage"
                  className="text-sm font-semibold text-gray-800"
                >
                  Reading Passage <span className="text-rose-500">*</span>
                </label>

                <span
                  className={`text-xs font-semibold ${
                    characterCount >= 50 ? "text-emerald-600" : "text-rose-500"
                  }`}
                >
                  {characterCount >= 50
                    ? "Minimum reached"
                    : `${50 - characterCount} more characters needed`}
                </span>
              </div>

              <div className="overflow-hidden rounded-2xl border border-gray-200 bg-gray-50/70 transition focus-within:border-emerald-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-emerald-500/10">
                <textarea
                  id="material-passage"
                  value={passage}
                  onChange={(e) => setPassage(e.target.value)}
                  placeholder="Write or paste your reading passage here..."
                  rows={7}
                  required
                  disabled={saving}
                  className="block w-full resize-y bg-transparent px-4 py-4 text-sm leading-7 text-gray-700 outline-none placeholder:text-gray-400"
                />

                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-gray-200 bg-white px-4 py-3">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <AlignLeft size={15} />
                    <span>
                      <strong className="text-gray-800">{wordCount}</strong>{" "}
                      {wordCount === 1 ? "word" : "words"}
                    </span>
                  </div>

                  <span className="text-xs font-medium text-gray-500">
                    {passage.length} characters typed
                  </span>
                </div>
              </div>

              <p className="mt-2 flex items-start gap-1.5 text-xs leading-relaxed text-gray-400">
                <AlertCircle size={14} className="mt-0.5 shrink-0" />
                Enter at least 50 non-whitespace characters.
              </p>
            </div>

            {error && (
              <div
                role="alert"
                className="whitespace-pre-line rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
              >
                {error}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex flex-col-reverse gap-3 border-t border-gray-100 bg-gray-50/70 px-6 py-5 sm:flex-row sm:items-center sm:justify-end sm:px-8">
            <button
              type="button"
              onClick={handleClose}
              disabled={saving}
              className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-600 transition hover:bg-gray-100 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={!isValid || saving}
              className={`flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all ${
                isValid && !saving
                  ? "bg-emerald-600 text-white shadow-md hover:bg-emerald-700"
                  : "cursor-not-allowed bg-rose-100 text-rose-400"
              }`}
            >
              {saving ? (
                <>
                  <LoaderCircle size={17} className="animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Plus size={17} />
                  Save Material
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddReadingMaterialModal;
