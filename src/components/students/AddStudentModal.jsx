
import React, { useState } from "react";
import {
  X,
  UserPlus,
  UserRound,
  LoaderCircle,
  CheckCircle2,
  Lock,
  AtSign,
} from "lucide-react";
import api from "../../assets/api";

const AddStudentModal = ({ onClose, onRefresh }) => {
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [credentials, setCredentials] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();

    const trimmedName = fullName.trim();
    const trimmedUsername = username.trim();

    if (!trimmedName || !trimmedUsername || !password) {
      setError("Please complete all fields.");
      return;
    }

    if (password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await api.post("/api/users/add/", {
        first_name: trimmedName,
        username: trimmedUsername,
        password: password,
      });

      const data = response.data?.user || response.data;

      if (typeof onRefresh === "function") {
        await onRefresh();
      }

      setCredentials({
        username: data?.username || trimmedUsername,
        password: password,
        name: data?.first_name || trimmedName,
      });
    } catch (err) {
      console.error("Failed to create student:", err);

      const responseData = err.response?.data;

      const detail =
        responseData?.detail ||
        responseData?.username?.[0] ||
        responseData?.password?.[0] ||
        responseData?.first_name?.[0] ||
        responseData?.non_field_errors?.[0] ||
        responseData?.error;

      setError(
        typeof detail === "string"
          ? detail
          : "Unable to create the student. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-4 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 disabled:bg-gray-50";

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
        aria-labelledby="add-student-title"
        className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-gray-100 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
              {credentials ? (
                <CheckCircle2 size={22} />
              ) : (
                <UserPlus size={22} />
              )}
            </div>

            <div>
              <h2
                id="add-student-title"
                className="text-lg font-bold text-gray-900"
              >
                {credentials ? "Student Created" : "Add New Student"}
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                {credentials
                  ? "Student account created successfully."
                  : "Create a student account and login credentials."}
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

        {/* Success */}
        {credentials ? (
          <div className="space-y-5 p-6">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-sm font-semibold text-emerald-800">
                {credentials.name}
              </p>

              <div className="mt-4">
                <p className="text-xs font-medium text-gray-500">
                  Username
                </p>
                <p className="mt-1 break-all font-mono text-sm text-gray-900">
                  {credentials.username}
                </p>
              </div>

              <div className="mt-3">
                <p className="text-xs font-medium text-gray-500">
                  Password
                </p>
                <p className="mt-1 break-all font-mono text-sm text-gray-900">
                  {credentials.password}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              Done
            </button>
          </div>
        ) : (
          /* Form */
          <form onSubmit={handleSubmit} className="space-y-5 p-6">
            {/* Full Name */}
            <div>
              <label
                htmlFor="student-full-name"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                Full Name
              </label>

              <div className="relative">
                <UserRound
                  size={18}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  id="student-full-name"
                  type="text"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  placeholder="e.g. Juan Dela Cruz"
                  autoComplete="name"
                  maxLength={150}
                  required
                  autoFocus
                  disabled={loading}
                  className={inputClass}
                />
              </div>

              <p className="mt-1.5 text-xs text-gray-400">
                Saved in the first_name field.
              </p>
            </div>

            {/* Username */}
            <div>
              <label
                htmlFor="student-username"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                Username
              </label>

              <div className="relative">
                <AtSign
                  size={18}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  id="student-username"
                  type="text"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  placeholder="Enter username"
                  autoComplete="username"
                  maxLength={150}
                  required
                  disabled={loading}
                  className={inputClass}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="student-password"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                Password
              </label>

              <div className="relative">
                <Lock
                  size={18}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  id="student-password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter password"
                  autoComplete="new-password"
                  minLength={8}
                  required
                  disabled={loading}
                  className={inputClass}
                />
              </div>

              <p className="mt-1.5 text-xs text-gray-400">
                Minimum 8 characters.
              </p>
            </div>

            {/* Error */}
            {error && (
              <p
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              >
                {error}
              </p>
            )}

            {/* Buttons */}
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
                disabled={
                  loading ||
                  !fullName.trim() ||
                  !username.trim() ||
                  !password
                }
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
              >
                {loading ? (
                  <>
                    <LoaderCircle size={17} className="animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <UserPlus size={17} />
                    Create Student
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default AddStudentModal;
