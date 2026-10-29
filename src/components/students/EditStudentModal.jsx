import React, { useEffect, useState } from "react";
import { X, UserRoundPen, LoaderCircle } from "lucide-react";
import api from "../../assets/api";

const EditStudentModal = ({ student, onClose, onRefresh }) => {
  const [fullName, setFullName] = useState(
    student?.name || student?.first_name || student?.full_name || ""
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setFullName(
      student?.name || student?.first_name || student?.full_name || ""
    );
    setError("");
  }, [student]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    const trimmedName = fullName.trim();

    if (!trimmedName) {
      setError("Please enter the student's full name.");
      return;
    }

    if (!student?.id) {
      setError("The student ID is missing. Please reload the student list.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await api.patch(`/api/users/edit/${student.id}/`, {
        first_name: trimmedName,
      });

      // Refresh the parent after the API confirms the update.
      if (typeof onRefresh === "function") {
        await onRefresh();
      }

      onClose();
    } catch (err) {
      console.error("Failed to update student:", err);

      const responseData = err.response?.data;
      const detail =
        responseData?.detail ||
        responseData?.first_name?.[0] ||
        responseData?.non_field_errors?.[0] ||
        responseData?.error;

      setError(
        typeof detail === "string"
          ? detail
          : "Unable to update the student's name. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-gray-950/50 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !loading) {
          onClose();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-student-title"
        className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl"
      >
        <div className="flex items-start justify-between border-b border-gray-100 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
              <UserRoundPen size={22} />
            </div>

            <div>
              <h2
                id="edit-student-title"
                className="text-lg font-bold text-gray-900"
              >
                Edit Student Name
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Update the student's full name.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            aria-label="Close modal"
            className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-6">
          <div>
            <label
              htmlFor="edit-student-full-name"
              className="mb-2 block text-sm font-semibold text-gray-700"
            >
              Student Full Name
            </label>

            <input
              id="edit-student-full-name"
              type="text"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              placeholder="Enter full name"
              autoComplete="name"
              maxLength={150}
              required
              autoFocus
              disabled={loading}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 disabled:bg-gray-50"
            />
          </div>

          {error && (
            <p
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {error}
            </p>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading || !fullName.trim()}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
            >
              {loading ? (
                <>
                  <LoaderCircle size={17} className="animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditStudentModal;