/* eslint-disable no-unused-vars */
import React from "react";
import { motion } from "framer-motion";
import { BookOpen, User, Lock, ArrowRight, Leaf, Feather } from "lucide-react";
import loginAnimation from "../utils/loginAnimations";
import { Link } from "react-router-dom";

function Login() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#173B2F] flex items-center justify-center px-2 md:px-6 py-4 md:py-10">
      <motion.div
        variants={loginAnimation.background}
        initial="hidden"
        animate="show"
        className="absolute inset-0"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-[#10271F] via-[#173B2F] to-[#2C5C47]" />

        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 left-20 w-72 h-72 rounded-full bg-green-400/20 blur-[120px]" />
          <div className="absolute bottom-20 right-20 w-80 h-80 rounded-full bg-lime-300/10 blur-[120px]" />
        </div>

        <motion.div
          variants={loginAnimation.leafOne}
          animate="animate"
          className="absolute top-20 left-24 text-green-300/15"
        >
          <Leaf size={70} />
        </motion.div>

        <motion.div
          variants={loginAnimation.leafTwo}
          animate="animate"
          className="absolute bottom-24 right-28 text-lime-200/15"
        >
          <Leaf size={95} />
        </motion.div>

        <motion.div
          variants={loginAnimation.feather}
          animate="animate"
          className="absolute top-44 right-44 text-white/10"
        >
          <Feather size={70} />
        </motion.div>
      </motion.div>

      <motion.div
        variants={loginAnimation.paper}
        initial="hidden"
        animate="show"
        className="relative z-10 w-full max-w-md"
      >
        <div className="absolute -inset-2 rounded-[36px] bg-gradient-to-br from-[#C9A95A] via-[#E8D79A] to-[#A9842A] opacity-40 blur-xl" />

        <div className="relative overflow-hidden rounded-[34px] border border-[#D8C48A] bg-[#F8F5EC] shadow-[0_30px_70px_rgba(0,0,0,.45)]">
          <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/paper.png')]" />

          <div className="absolute top-5 left-5 h-8 w-8 border-l-2 border-t-2 border-[#C8A84F]" />
          <div className="absolute top-5 right-5 h-8 w-8 border-r-2 border-t-2 border-[#C8A84F]" />
          <div className="absolute bottom-5 left-5 h-8 w-8 border-l-2 border-b-2 border-[#C8A84F]" />
          <div className="absolute bottom-5 right-5 h-8 w-8 border-r-2 border-b-2 border-[#C8A84F]" />

          <div className="relative px-10 py-12">
            <motion.div
              variants={loginAnimation.logo}
              animate="animate"
              className="mx-auto flex h-24 w-24 items-center justify-center rounded-full border-4 border-[#D8C48A] bg-gradient-to-br from-[#35694F] to-[#214635] shadow-lg"
            >
              <BookOpen size={42} className="text-[#F9F4E5]" />
            </motion.div>

            <motion.h1
              variants={loginAnimation.title}
              initial="hidden"
              animate="show"
              className="mt-8 text-center font-serif text-2xl md:text-4xl font-bold text-[#214635]"
            >
              Reading
              <br />
              Comprehension
            </motion.h1>

            <form className="space-y-6 mt-8">
              <div>
                <label className="mb-2 block text-sm font-semibold tracking-wide text-[#31563D]">
                  Username
                </label>

                <div className="group flex items-center border-b-2 border-[#D8C48A] pb-3 transition duration-300 focus-within:border-[#35694F]">
                  <User size={20} className="text-[#35694F]" />

                  <input
                    type="text"
                    placeholder="Enter your username"
                    className="ml-3 w-full bg-transparent text-[#214635] outline-none placeholder:text-gray-400"
                  />
                </div>
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold tracking-wide text-[#31563D]">
                  Password
                </label>

                <div className="group flex items-center border-b-2 border-[#D8C48A] pb-3 transition duration-300 focus-within:border-[#35694F]">
                  <Lock size={20} className="text-[#35694F]" />

                  <input
                    type="password"
                    placeholder="Enter your password"
                    className="ml-3 w-full bg-transparent text-[#214635] outline-none placeholder:text-gray-400"
                  />
                </div>
              </div>{" "}
              <Link to={'/dashboard'}>
                <motion.button
                  variants={loginAnimation.button}
                  whileHover="hover"
                  whileTap="tap"
                  type="submit"
                  className="group cursor-pointer relative mt-4 flex h-14 w-full items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-r from-[#214635] via-[#35694F] to-[#4F8A64] text-white shadow-xl"
                >
                  <motion.div
                    variants={loginAnimation.buttonLight}
                    animate="animate"
                    className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent"
                  />

                  <span className="relative flex items-center gap-3 font-semibold tracking-wide">
                    Open Book
                    <motion.div
                      variants={loginAnimation.arrow}
                      animate="animate"
                    >
                      <ArrowRight size={18} />
                    </motion.div>
                  </span>
                </motion.button>
              </Link>
            </form>

            <div className="my-10 flex items-center">
              <div className="h-px flex-1 bg-[#D8C48A]" />
              <span className="mx-4 text-xs uppercase tracking-[0.35em] text-[#A48A55]">
                Begin Learning
              </span>
              <div className="h-px flex-1 bg-[#D8C48A]" />
            </div>

            <p className="mt-10 text-center text-sm text-[#4B5D55]">
              New to Reading Comprehension?
            </p>

            <button
              type="button"
              className="mt-3 w-full rounded-xl border border-[#35694F] py-3 font-semibold text-[#35694F] transition hover:bg-[#35694F] hover:text-white"
            >
              Create Account
            </button>

            <div className="mt-10 flex justify-center gap-3">
              <motion.span
                variants={loginAnimation.sparkle}
                animate="animate"
                className="h-2 w-2 rounded-full bg-[#C7A64A]"
              />

              <motion.span
                variants={loginAnimation.sparkle}
                animate="animate"
                transition={{
                  delay: 0.5,
                  duration: 3,
                  repeat: Infinity,
                }}
                className="h-2 w-2 rounded-full bg-[#35694F]"
              />

              <motion.span
                variants={loginAnimation.sparkle}
                animate="animate"
                transition={{
                  delay: 1,
                  duration: 3,
                  repeat: Infinity,
                }}
                className="h-2 w-2 rounded-full bg-[#C7A64A]"
              />
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default Login;
