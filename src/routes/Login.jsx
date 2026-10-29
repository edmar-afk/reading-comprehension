import React, { useState } from "react";
import {
  FiUser,
  FiLock,
  FiEye,
  FiEyeOff,
  FiMapPin,
  FiBookOpen,
} from "react-icons/fi";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";

import bg from "../assets/images/bg.jpg";
import logo from "../assets/images/logo.jpg";

export default function Login() {
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);

    try {
      // DEMO LOGIN ONLY.
      // Replace this block with your backend/database API
      // before deploying the application.
      if (
        username.trim() === "admin" &&
        password === "admin123"
      ) {
        await Swal.fire({
          icon: "success",
          title: "Login Successful!",
          text: "Welcome back, Administrator.",
          confirmButtonText: "Continue",
          confirmButtonColor: "#065f46",
          allowOutsideClick: false,
        });

        navigate("/dashboard", { replace: true });
      } else {
        await Swal.fire({
          icon: "error",
          title: "Login Failed",
          text: "Invalid username or password.",
          confirmButtonColor: "#065f46",
        });
      }
    } catch (error) {
      console.error("Login error:", error);

      Swal.fire({
        icon: "error",
        title: "Something went wrong",
        text: "Please try again.",
        confirmButtonColor: "#065f46",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen w-full relative flex flex-col justify-between bg-cover bg-center bg-no-repeat font-sans"
      style={{ backgroundImage: `url(${bg})` }}
    >
      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black/25 z-0" />

      {/* Main Container */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-8">
        {/* Header */}
        <div className="text-center text-white mb-6 drop-shadow-md">
          <h1 className="text-4xl sm:text-5xl font-black tracking-wide">
            JHCSC
          </h1>

          <h2 className="text-sm sm:text-base font-bold tracking-wider mt-1 uppercase">
            CANUTO MS ENERIO CAMPUS
          </h2>

          <p className="text-xs sm:text-sm font-semibold tracking-wide text-gray-200 mt-1 uppercase">
            BISWANGAN, LAKEWOOD
            <br />
            ZAMBOANGA DEL SUR
          </p>
        </div>

        {/* Login Card */}
        <div className="w-full max-w-md bg-white/35 backdrop-blur-md rounded-3xl p-6 sm:p-8 border border-white/40 shadow-2xl flex flex-col items-center text-gray-800">
          <h3 className="text-center text-lg sm:text-xl font-bold text-white mb-4 leading-tight drop-shadow-sm">
            Intelligent Reading Performance
            <br />
            Evaluation Platform Using AI
          </h3>

          {/* Logo */}
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden mb-4 border-2 border-white/60 bg-white shadow-md flex items-center justify-center">
            <img
              src={logo}
              alt="JHCSC Seal"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Welcome */}
          <h2 className="text-2xl font-bold text-emerald-950 mb-0.5">
            Welcome Back!
          </h2>

          <p className="text-emerald-900 text-sm font-medium mb-6">
            Login to continue
          </p>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="w-full space-y-4">
            {/* Username */}
            <div className="relative flex items-center">
              <span className="absolute left-4 text-emerald-900 text-xl">
                <FiUser />
              </span>

              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                required
                disabled={loading}
                className="w-full bg-white/80 focus:bg-white text-gray-800 placeholder-gray-500 rounded-xl py-3.5 pl-12 pr-4 outline-none transition duration-200 shadow-inner disabled:opacity-70"
              />
            </div>

            {/* Password */}
            <div className="relative flex items-center">
              <span className="absolute left-4 text-emerald-900 text-xl">
                <FiLock />
              </span>

              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                disabled={loading}
                className="w-full bg-white/80 focus:bg-white text-gray-800 placeholder-gray-500 rounded-xl py-3.5 pl-12 pr-12 outline-none transition duration-200 shadow-inner disabled:opacity-70"
              />

              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={
                  showPassword ? "Hide password" : "Show password"
                }
                className="absolute right-4 text-emerald-900 text-xl focus:outline-none"
              >
                {showPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-900 hover:bg-emerald-950 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl shadow-lg transition duration-200 mt-2 text-base"
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10 bg-emerald-900 text-white rounded-t-[2.5rem] px-6 py-4 mt-4 shadow-lg">
        <div className="max-w-4xl mx-auto flex flex-row items-center justify-between text-xs sm:text-sm font-medium">
          <div className="flex items-center space-x-2">
            <FiMapPin className="text-xl sm:text-2xl flex-shrink-0" />

            <div>
              <p className="leading-tight">Biswangan, Lakewood</p>
              <p className="leading-tight text-gray-300">
                Zamboanga del Sur
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 text-right">
            <div>
              <p className="leading-tight font-semibold">
                Sapientia et Cultura
              </p>

              <p className="leading-tight text-gray-300 text-[11px] sm:text-xs">
                (Wisdom and Culture)
              </p>
            </div>

            <FiBookOpen className="text-xl sm:text-2xl flex-shrink-0" />
          </div>
        </div>
      </div>
    </div>
  );
}
