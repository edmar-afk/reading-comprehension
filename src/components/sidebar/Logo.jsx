import { BookOpen } from "lucide-react";

function Logo() {
  return (
    <div className="flex items-center gap-3">
      {/* Logo */}
      <div
        className="
          flex
          h-14
          w-14
          items-center
          justify-center
          rounded-full
          bg-gradient-to-br from-[#35694F] to-[#214635] px-4
          text-white
          shadow-lg
          shadow-indigo-500/20
        "
      >
        <BookOpen size={30} strokeWidth={2.3} />
      </div>

      {/* Title */}
      <div className="leading-tight">
        <h1 className="text-lg font-bold tracking-tight text-slate-900">
          Reading
        </h1>

        <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
          Comprehension
        </p>
      </div>
    </div>
  );
}

export default Logo;
