import React, { useEffect, useState } from "react";
import { X, BookOpen, LoaderCircle, CheckCircle2 } from "lucide-react";
import api from "../../assets/api";

const ReadingQuizModal = ({
  materialId,
  studentId,
  onQuizSubmitted,
  onClose,
}) => {
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const fetchQuiz = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await api.get("/api/student/quizzes/");

        const data = response.data;
        const quizzes = Array.isArray(data) ? data : data.results || [];

        const matchingQuiz = quizzes.find(
          (item) => Number(item.reading_material) === Number(materialId),
        );

        if (!matchingQuiz) {
          if (!cancelled) {
            setError("No quiz has been created for this reading material yet.");
          }
          return;
        }

        if (!cancelled) {
          setQuiz(matchingQuiz);
        }
      } catch (err) {
        console.error("Failed to load reading quiz:", err);

        if (!cancelled) {
          setError(
            err.response?.data?.detail ||
              "Unable to load the quiz. Please try again.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    if (materialId) {
      fetchQuiz();
    }

    return () => {
      cancelled = true;
    };
  }, [materialId]);

  const handleAnswerChange = (questionId, selectedAnswer) => {
    setAnswers((previous) => ({
      ...previous,
      [questionId]: selectedAnswer,
    }));
  };

  const handleSubmit = async () => {
    if (!studentId) {
      setError("Please select a student first.");
      return;
    }

    if (!quiz || !quiz.questions?.length) {
      setError("This quiz has no questions.");
      return;
    }

    const unanswered = quiz.questions.some((question) => !answers[question.id]);

    if (unanswered) {
      setError("Please answer all questions before submitting.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const payload = {
        student: Number(studentId),
        answers: quiz.questions.map((question) => ({
          question_id: question.id,
          selected_answer: answers[question.id],
        })),
      };

      const response = await api.post(
        `/api/quizzes/${quiz.id}/submit/`,
        payload,
      );

      setResult(response.data);

      // Save the reading rating only after quiz submission succeeds.
      if (onQuizSubmitted) {
        await onQuizSubmitted(response.data);
      }
    } catch (err) {
      console.error("Quiz submission failed:", err);

      setError(
        err.response?.data?.error ||
          err.response?.data?.detail ||
          "Failed to submit the quiz. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-3 sm:p-5">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* HEADER */}
        <div className="flex items-center justify-between border-b px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-green-100 p-2 text-green-700">
              <BookOpen size={22} />
            </div>

            <div>
              <h2 className="text-lg font-bold text-gray-800">
                Reading Comprehension Quiz
              </h2>
              <p className="text-sm text-gray-500">
                Test your understanding of the reading material.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 disabled:opacity-40"
          >
            <X size={21} />
          </button>
        </div>

        {/* CONTENT */}
        <div className="flex-1 overflow-y-auto p-5">
          {loading && (
            <div className="flex flex-col items-center justify-center py-16">
              <LoaderCircle className="animate-spin text-green-600" size={35} />
              <p className="mt-3 text-sm text-gray-500">Loading quiz...</p>
            </div>
          )}

          {!loading && error && !quiz && (
            <div className="rounded-xl bg-red-50 p-4 text-center text-sm text-red-700">
              {error}
            </div>
          )}

          {!loading && quiz && !result && (
            <>
              <div className="mb-5 rounded-xl bg-green-50 p-4">
                <h3 className="font-bold text-green-800">{quiz.title}</h3>
                <p className="mt-1 text-sm text-green-700">
                  {quiz.questions?.length || 0} questions
                </p>
              </div>

              {!quiz.questions?.length ? (
                <p className="rounded-lg bg-amber-50 p-4 text-sm text-amber-800">
                  This quiz does not contain any questions.
                </p>
              ) : (
                <div className="space-y-6">
                  {quiz.questions.map((question, index) => {
                    const choices = [
                      { value: "1", label: question.answer_1 },
                      { value: "2", label: question.answer_2 },
                      { value: "3", label: question.answer_3 },
                    ];

                    return (
                      <div
                        key={question.id}
                        className="rounded-xl border border-gray-200 p-4"
                      >
                        <p className="mb-4 font-semibold text-gray-800">
                          {index + 1}. {question.question}
                        </p>

                        <div className="space-y-2">
                          {choices.map((choice) => (
                            <label
                              key={choice.value}
                              className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition ${
                                answers[question.id] === choice.value
                                  ? "border-green-500 bg-green-50"
                                  : "border-gray-200 hover:bg-gray-50"
                              }`}
                            >
                              <input
                                type="radio"
                                name={`question-${question.id}`}
                                value={choice.value}
                                checked={answers[question.id] === choice.value}
                                onChange={() =>
                                  handleAnswerChange(question.id, choice.value)
                                }
                                className="accent-green-600"
                              />

                              <span className="text-sm text-gray-700">
                                {choice.label}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {error && (
                <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                  {error}
                </div>
              )}
            </>
          )}

          {result && (
            <div className="py-8 text-center">
              <CheckCircle2 size={60} className="mx-auto text-green-600" />

              <h3 className="mt-4 text-2xl font-bold text-gray-800">
                Quiz Submitted!
              </h3>

              <p className="mt-3 text-4xl font-extrabold text-green-600">
                {result.result.score}/{result.result.total_questions}
              </p>

              <p className="mt-1 text-sm text-gray-500">
                {result.percentage}% score
              </p>

              <div className="mt-5 rounded-xl bg-green-50 p-4 text-sm text-green-800">
                {result.result.feedback}
              </div>

              <p className="mt-4 text-sm text-gray-500">
                Your quiz result has been saved.
              </p>
            </div>
          )}
        </div>

        {/* FOOTER */}
        {!loading && quiz && !result && (
          <div className="flex items-center justify-between gap-3 border-t bg-gray-50 px-5 py-4">
            <p className="text-sm text-gray-500">
              {Object.keys(answers).length} of {quiz.questions?.length || 0}{" "}
              answered
            </p>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || !quiz.questions?.length}
              className="flex items-center gap-2 rounded-xl bg-green-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting && (
                <LoaderCircle size={17} className="animate-spin" />
              )}

              {submitting ? "Submitting..." : "Submit Quiz"}
            </button>
          </div>
        )}

        {result && (
          <div className="border-t bg-gray-50 px-5 py-4 text-right">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl bg-green-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-green-700"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReadingQuizModal;
