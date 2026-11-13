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
  ClipboardList,
  Trash2,
  CircleHelp,
  CheckCircle2,
  FileText,
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

const createEmptyQuestion = () => ({
  question: "",
  answer_1: "",
  answer_2: "",
  answer_3: "",
  correct_answer: "1",
});

const AddReadingMaterialModal = ({ onClose, onSaved }) => {
  // READING MATERIAL STATES
  const [title, setTitle] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [passage, setPassage] = useState("");

  // QUIZ STATES
  const [addQuiz, setAddQuiz] = useState(true);
  const [quizTitle, setQuizTitle] = useState("");
  const [questions, setQuestions] = useState([
    createEmptyQuestion(),
  ]);

  // GENERAL STATES
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Prevent duplicate material creation if quiz creation fails.
  const [savedMaterialId, setSavedMaterialId] = useState(null);

  const wordCount = passage.trim()
    ? passage.trim().split(/\s+/).length
    : 0;

  const characterCount = passage.trim().length;

  const isMaterialValid =
    title.trim().length > 0 &&
    difficulty !== "" &&
    characterCount >= 50;

  const isQuizValid =
    !addQuiz ||
    (
      quizTitle.trim().length > 0 &&
      questions.length > 0 &&
      questions.every(
        (q) =>
          q.question.trim() &&
          q.answer_1.trim() &&
          q.answer_2.trim() &&
          q.answer_3.trim() &&
          ["1", "2", "3"].includes(q.correct_answer)
      )
    );

  const isValid = isMaterialValid && isQuizValid;

  // RESET FORM
  const resetForm = () => {
    setTitle("");
    setDifficulty("");
    setPassage("");

    setAddQuiz(true);
    setQuizTitle("");
    setQuestions([createEmptyQuestion()]);

    setError("");
    setSavedMaterialId(null);
  };

  const handleClose = () => {
    if (saving) return;

    resetForm();
    onClose();
  };

  // ADD QUESTION
  const addQuestion = () => {
    setQuestions((prev) => [
      ...prev,
      createEmptyQuestion(),
    ]);
  };

  // REMOVE QUESTION
  const removeQuestion = (index) => {
    setQuestions((prev) =>
      prev.filter((_, i) => i !== index)
    );
  };

  // UPDATE QUESTION
  const updateQuestion = (index, field, value) => {
    setQuestions((prev) =>
      prev.map((question, i) =>
        i === index
          ? { ...question, [field]: value }
          : question
      )
    );
  };

  // FORMAT API ERRORS
  const getErrorMessage = (err) => {
    const data = err.response?.data;

    if (data?.detail) return data.detail;
    if (data?.error) return data.error;

    if (data) {
      return Object.entries(data)
        .map(([key, value]) => {
          const message = Array.isArray(value)
            ? value.join(", ")
            : typeof value === "string"
              ? value
              : JSON.stringify(value);

          return `${key}: ${message}`;
        })
        .join("\n");
    }

    return err.message || "Something went wrong.";
  };

  // SAVE MATERIAL AND QUIZ
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isValid || saving) return;

    setSaving(true);
    setError("");

    try {
      let materialId = savedMaterialId;

      // STEP 1: SAVE READING MATERIAL
      // Skip this step if it was already saved successfully.

      if (!materialId) {
        const materialResponse = await api.post(
          "/api/reading-materials/",
          {
            title: title.trim(),
            difficulty,
            content: passage.trim(),
          }
        );

        materialId = materialResponse.data?.id;

        if (!materialId) {
          throw new Error(
            "Reading material was saved, but its ID was not returned by the API."
          );
        }

        setSavedMaterialId(materialId);
      }

      // STEP 2: SAVE QUIZ
      if (addQuiz) {
        const quizPayload = {
          reading_material: materialId,
          title: quizTitle.trim(),
          questions: questions.map((q) => ({
            question: q.question.trim(),
            answer_1: q.answer_1.trim(),
            answer_2: q.answer_2.trim(),
            answer_3: q.answer_3.trim(),
            correct_answer: q.correct_answer,
          })),
        };

        await api.post("/api/quizzes/", quizPayload);
      }

      // STEP 3: REFRESH READING MATERIALS
      if (onSaved) {
        await onSaved();
      }

      resetForm();
      onClose();

    } catch (err) {
      const message = getErrorMessage(err);

      if (savedMaterialId || err.response) {
        setError(
          savedMaterialId
            ? `Reading material has already been saved. Quiz creation failed: ${message} You can try saving again without creating a duplicate reading material.`
            : message
        );
      } else {
        setError(message);
      }

    } finally {
      setSaving(false);
    }
  };

  const styles = {
    Easy: {
      selected:
        "border-emerald-500 bg-emerald-50 ring-2 ring-emerald-500/10",
      icon: "bg-emerald-100 text-emerald-700",
      dot: "border-emerald-600 bg-emerald-600",
      text: "text-emerald-700",
    },
    Medium: {
      selected:
        "border-amber-500 bg-amber-50 ring-2 ring-amber-500/10",
      icon: "bg-amber-100 text-amber-700",
      dot: "border-amber-500 bg-amber-500",
      text: "text-amber-700",
    },
    Hard: {
      selected:
        "border-rose-500 bg-rose-50 ring-2 ring-rose-500/10",
      icon: "bg-rose-100 text-rose-700",
      dot: "border-rose-500 bg-rose-500",
      text: "text-rose-700",
    },
  };

  return (
    <div
      className="fixed inset-0 z-[99999999] flex items-center justify-center overflow-y-auto bg-slate-950/50 p-3 backdrop-blur-sm sm:p-6"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-material-title"
        className="my-auto flex max-h-[94vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-white bg-white shadow-2xl"
      >
        {/* HEADER */}
        <div className="relative shrink-0 overflow-hidden border-b border-gray-100 bg-gradient-to-br from-emerald-50 via-white to-teal-50 px-6 py-5 sm:px-8">
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
                  Create a reading passage and its accompanying quiz.
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

          <p className="relative mt-4 text-xs font-medium text-emerald-700">
            <span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Complete the required fields before saving.
          </p>
        </div>

        {/* FORM */}
        <form
          onSubmit={handleSubmit}
          className="flex min-h-0 flex-1 flex-col"
        >
          {/* SCROLLABLE CONTENT */}
          <div className="min-h-0 flex-1 space-y-8 overflow-y-auto px-6 py-6 sm:px-8">

            {/* ================================== */}
            {/* READING MATERIAL SECTION */}
            {/* ================================== */}

            <section className="space-y-6">
              <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                  <FileText size={20} />
                </div>

                <div>
                  <h3 className="font-bold text-gray-900">
                    Reading Material
                  </h3>

                  <p className="text-xs text-gray-500">
                    Provide the reading passage for your students.
                  </p>
                </div>
              </div>

              {/* MATERIAL TITLE */}
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
                  disabled={saving || !!savedMaterialId}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50/70 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 disabled:opacity-60"
                />

                <div className="mt-1.5 flex justify-between text-xs text-gray-400">
                  <span>Choose a descriptive title.</span>
                  <span>{title.length}/120</span>
                </div>
              </div>

              {/* DIFFICULTY */}
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
                        } ${saving || savedMaterialId ? "pointer-events-none opacity-60" : ""}`}
                      >
                        <input
                          type="radio"
                          name="difficulty"
                          value={option.value}
                          checked={selected}
                          onChange={() => setDifficulty(option.value)}
                          disabled={saving || !!savedMaterialId}
                          className="sr-only"
                        />

                        <div className="mb-3 flex items-center justify-between">
                          <div
                            className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                              selected
                                ? style.icon
                                : "bg-gray-100 text-gray-500"
                            }`}
                          >
                            <Icon size={20} />
                          </div>

                          <span
                            className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                              selected
                                ? style.dot
                                : "border-gray-300 bg-white"
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

              {/* READING PASSAGE */}
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
                      characterCount >= 50
                        ? "text-emerald-600"
                        : "text-rose-500"
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
                    disabled={saving || !!savedMaterialId}
                    className="block w-full resize-y bg-transparent px-4 py-4 text-sm leading-7 text-gray-700 outline-none placeholder:text-gray-400 disabled:opacity-60"
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
            </section>

            {/* ================================== */}
            {/* QUIZ SECTION */}
            {/* ================================== */}

            <section className="space-y-5 border-t border-gray-100 pt-7">

              {/* QUIZ HEADER */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
                    <ClipboardList size={20} />
                  </div>

                  <div>
                    <h3 className="font-bold text-gray-900">
                      Comprehension Quiz Questions
                    </h3>

                    <p className="text-xs text-gray-500">
                      Create Comprehension questions based on your reading material.
                    </p>
                  </div>
                </div>

                <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-gray-700">
                  <input
                    type="checkbox"
                    checked={addQuiz}
                    onChange={(e) => setAddQuiz(e.target.checked)}
                    disabled={saving || !!savedMaterialId}
                    className="h-4 w-4 accent-violet-600"
                  />
                  Add Quiz
                </label>
              </div>

              {addQuiz && (
                <div className="space-y-5">

                  {/* QUIZ TITLE */}
                  <div>
                    <label
                      htmlFor="quiz-title"
                      className="mb-2 block text-sm font-semibold text-gray-800"
                    >
                      Quiz Title <span className="text-rose-500">*</span>
                    </label>

                    <input
                      id="quiz-title"
                      type="text"
                      value={quizTitle}
                      onChange={(e) => setQuizTitle(e.target.value)}
                      placeholder="e.g. What have you learn?"
                      maxLength={255}
                      required={addQuiz}
                      disabled={saving}
                      className="w-full rounded-xl border border-gray-200 bg-gray-50/70 px-4 py-3 text-sm outline-none transition focus:border-violet-500 focus:bg-white focus:ring-4 focus:ring-violet-500/10"
                    />
                  </div>

                  {/* QUESTION LIST */}
                  <div className="space-y-5">

                    {questions.map((question, index) => (
                      <div
                        key={index}
                        className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
                      >
                        {/* QUESTION HEADER */}
                        <div className="flex items-center justify-between border-b border-gray-100 bg-violet-50/70 px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-600 text-xs font-bold text-white">
                              {index + 1}
                            </span>

                            <span className="text-sm font-bold text-gray-800">
                              Question {index + 1}
                            </span>
                          </div>

                          {questions.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeQuestion(index)}
                              disabled={saving}
                              className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-semibold text-rose-500 transition hover:bg-rose-100 disabled:opacity-50"
                            >
                              <Trash2 size={14} />
                              Remove
                            </button>
                          )}
                        </div>

                        <div className="space-y-4 p-4">

                          {/* QUESTION TEXT */}
                          <div>
                            <label className="mb-2 block text-sm font-semibold text-gray-800">
                              Question <span className="text-rose-500">*</span>
                            </label>

                            <textarea
                              value={question.question}
                              onChange={(e) =>
                                updateQuestion(
                                  index,
                                  "question",
                                  e.target.value
                                )
                              }
                              placeholder="Enter your question here..."
                              rows={2}
                              required={addQuiz}
                              disabled={saving}
                              className="w-full resize-y rounded-xl border border-gray-200 bg-gray-50/70 px-4 py-3 text-sm outline-none transition focus:border-violet-500 focus:bg-white focus:ring-4 focus:ring-violet-500/10"
                            />
                          </div>

                          {/* ANSWER CHOICES */}
                          <div className="space-y-3">
                            <div className="flex items-center justify-between gap-2">
                              <label className="text-sm font-semibold text-gray-800">
                                Answer Choices
                              </label>

                              <span className="text-xs text-gray-400">
                                Select the correct answer
                              </span>
                            </div>

                            {[
                              {
                                key: "1",
                                field: "answer_1",
                                label: "Answer 1",
                              },
                              {
                                key: "2",
                                field: "answer_2",
                                label: "Answer 2",
                              },
                              {
                                key: "3",
                                field: "answer_3",
                                label: "Answer 3",
                              },
                            ].map((answer) => {
                              const selected =
                                question.correct_answer === answer.key;

                              return (
                                <div
                                  key={answer.key}
                                  className={`flex items-center gap-3 rounded-xl border p-3 transition ${
                                    selected
                                      ? "border-emerald-300 bg-emerald-50/70"
                                      : "border-gray-200 bg-gray-50/50"
                                  }`}
                                >
                                  <label className="flex shrink-0 cursor-pointer items-center gap-2">
                                    <input
                                      type="radio"
                                      name={`correct-answer-${index}`}
                                      value={answer.key}
                                      checked={selected}
                                      onChange={() =>
                                        updateQuestion(
                                          index,
                                          "correct_answer",
                                          answer.key
                                        )
                                      }
                                      disabled={saving}
                                      className="h-4 w-4 accent-emerald-600"
                                    />

                                    <span
                                      className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold ${
                                        selected
                                          ? "bg-emerald-600 text-white"
                                          : "bg-gray-200 text-gray-600"
                                      }`}
                                    >
                                      {answer.key}
                                    </span>
                                  </label>

                                  <input
                                    type="text"
                                    value={question[answer.field]}
                                    onChange={(e) =>
                                      updateQuestion(
                                        index,
                                        answer.field,
                                        e.target.value
                                      )
                                    }
                                    placeholder={answer.label}
                                    required={addQuiz}
                                    disabled={saving}
                                    className="min-w-0 flex-1 border-0 bg-transparent text-sm text-gray-800 outline-none placeholder:text-gray-400"
                                  />

                                  {selected && (
                                    <CheckCircle2
                                      size={18}
                                      className="shrink-0 text-emerald-600"
                                    />
                                  )}
                                </div>
                              );
                            })}
                          </div>

                          <p className="flex items-center gap-1.5 text-xs text-gray-400">
                            <CircleHelp size={14} />
                            Select the radio button beside the correct answer.
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* ADD QUESTION BUTTON */}
                  <button
                    type="button"
                    onClick={addQuestion}
                    disabled={saving}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-violet-300 bg-violet-50/50 px-4 py-4 text-sm font-bold text-violet-700 transition hover:border-violet-500 hover:bg-violet-50 disabled:opacity-50"
                  >
                    <Plus size={18} />
                    Add Another Question
                  </button>

                  <p className="text-center text-xs text-gray-400">
                    {questions.length} {questions.length === 1 ? "question" : "questions"} added
                  </p>
                </div>
              )}

              {!addQuiz && (
                <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-6 text-center">
                  <ClipboardList
                    size={28}
                    className="mx-auto text-gray-400"
                  />

                  <p className="mt-2 text-sm font-semibold text-gray-700">
                    Quiz creation disabled
                  </p>

                  <p className="mt-1 text-xs text-gray-400">
                    You can create a quiz for this material later.
                  </p>
                </div>
              )}
            </section>

            {/* ERROR MESSAGE */}
            {error && (
              <div
                role="alert"
                className="whitespace-pre-line rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm leading-relaxed text-rose-700"
              >
                <div className="mb-1 flex items-center gap-2 font-bold">
                  <AlertCircle size={17} />
                  Unable to complete saving
                </div>

                {error}
              </div>
            )}

            {/* SAVED MATERIAL NOTICE */}
            {savedMaterialId && (
              <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-medium text-emerald-700">
                <CheckCircle2 size={17} />
                Reading material saved. You can retry quiz creation.
              </div>
            )}
          </div>

          {/* FOOTER */}
          <div className="flex shrink-0 flex-col-reverse gap-3 border-t border-gray-100 bg-gray-50/90 px-6 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8">
            <p className="text-xs text-gray-400">
              {addQuiz
                ? "Reading material + Quiz"
                : "Reading material only"}
            </p>

            <div className="flex flex-col-reverse gap-3 sm:flex-row">
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
                    Save Material{addQuiz ? " & Quiz" : ""}
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddReadingMaterialModal;