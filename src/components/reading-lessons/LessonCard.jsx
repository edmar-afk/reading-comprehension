import { Chip, IconButton, Tooltip } from "@mui/material";

import {
  BookOpen,
  Pencil,
  Trash2,
  Eye,
  Clock3,
  FileText,
  BookMarked,
} from "lucide-react";

function LessonCard({ lesson, onEdit, onDelete, onPreview }) {
  const preview =
    lesson.content.length > 180
      ? lesson.content.substring(0, 180) + "..."
      : lesson.content;

  return (
    <div
      className="
        group
        relative
        overflow-hidden
        rounded-3xl
        border
        border-[#E7ECE8]
        bg-white
        shadow-md
        transition-all
        duration-300
        hover:-translate-y-2
        hover:border-[#C9A95A]
        hover:shadow-2xl
      "
    >
      {/* Decorative Background */}

      <div className="absolute -right-12 -top-12 h-36 w-36 rounded-full bg-[#173B2F]/5 blur-3xl" />

      {/* Header */}

      <div className="relative flex items-start justify-between p-6">
        <div className="flex gap-4">
          {/* Icon */}

          <div
            className="
              flex
              h-16
              w-16
              items-center
              justify-center
              rounded-2xl
              bg-[#EAF6F2]
              text-[#173B2F]
              transition-transform
              duration-300
              group-hover:scale-110
              group-hover:rotate-6
            "
          >
            <BookOpen size={30} />
          </div>

          <div>
            <h2 className="text-xl font-bold text-[#173B2F]">{lesson.title}</h2>

            <div className="mt-3 flex flex-wrap gap-2">
              <Chip
                label={lesson.difficulty}
                size="small"
                sx={{
                  bgcolor: "#FFF8E8",
                  color: "#A48A55",
                  fontWeight: 700,
                }}
              />

              <Chip
                icon={<FileText size={14} />}
                label={`${lesson.wordCount} words`}
                size="small"
                sx={{
                  bgcolor: "#F8FBFA",
                }}
              />
            </div>
          </div>
        </div>

        {/* Actions */}

        <div
          className="
            flex
            gap-1
            opacity-0
            transition-all
            duration-300
            group-hover:opacity-100
          "
        >
          <Tooltip title="Preview">
            <IconButton onClick={() => onPreview(lesson)}>
              <Eye size={18} />
            </IconButton>
          </Tooltip>

          <Tooltip title="Edit">
            <IconButton onClick={() => onEdit(lesson)}>
              <Pencil size={18} />
            </IconButton>
          </Tooltip>

          <Tooltip title="Delete">
            <IconButton color="error" onClick={() => onDelete(lesson)}>
              <Trash2 size={18} />
            </IconButton>
          </Tooltip>
        </div>
      </div>

      {/* Divider */}

      <div className="mx-6 border-t border-[#EEF2EF]" />

      {/* Preview */}

      <div className="px-6 py-5">
        <div className="mb-3 flex items-center gap-2">
          <BookMarked size={17} className="text-[#A48A55]" />

          <span className="text-sm font-semibold text-[#A48A55] uppercase tracking-wide">
            Passage Preview
          </span>
        </div>

        <p className="line-clamp-5 text-[15px] leading-8 text-slate-600">
          {preview}
        </p>
      </div>

      {/* Footer */}

      <div className="flex items-center justify-between border-t border-[#EEF2EF] bg-[#F8FBFA] px-6 py-5">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Clock3 size={16} />

          <span>Updated {lesson.updatedAt}</span>
        </div>

        <button
          onClick={() => onPreview(lesson)}
          className="
            rounded-xl
            bg-[#FFF8E8]
            px-5
            py-2.5
            font-semibold
            text-[#A48A55]
            transition-all
            duration-300
            hover:bg-[#F6E4AF]
            hover:shadow-md
          "
        >
          Read Lesson
        </button>
      </div>

      {/* Hover Accent */}

      <div
        className="
          absolute
          bottom-0
          left-0
          h-1
          w-0
          bg-gradient-to-r
          from-[#173B2F]
          via-[#C9A95A]
          to-[#C7A64A]
          transition-all
          duration-500
          group-hover:w-full
        "
      />
    </div>
  );
}

export default LessonCard;
