import {
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Chip,
  Button,
} from "@mui/material";

import { X, BookOpen, Clock3, FileText, Printer } from "lucide-react";

function LessonPreview({ open, lesson, onClose }) {
  if (!lesson) return null;

  const words =
    lesson.wordCount ||
    lesson.content.trim().split(/\s+/).filter(Boolean).length;

  const readingTime = Math.max(1, Math.ceil(words / 200));

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: "26px",
          overflow: "hidden",
        },
      }}
    >
      {/* Header */}

      <DialogTitle className="border-b border-[#E7ECE8] bg-white px-8 py-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#EAF6F2] text-[#173B2F]">
              <BookOpen size={30} />
            </div>

            <div>
              <h2 className="text-3xl font-bold text-[#173B2F]">
                {lesson.title}
              </h2>

              <div className="mt-4 flex flex-wrap gap-2">
                <Chip
                  label={lesson.difficulty}
                  sx={{
                    bgcolor: "#FFF8E8",
                    color: "#A48A55",
                    fontWeight: 700,
                  }}
                />

                <Chip
                  icon={<FileText size={14} />}
                  label={`${words} Words`}
                  sx={{
                    bgcolor: "#F8FBFA",
                  }}
                />

                <Chip
                  icon={<Clock3 size={14} />}
                  label={`${readingTime} min read`}
                  sx={{
                    bgcolor: "#F8FBFA",
                  }}
                />
              </div>
            </div>
          </div>

          <IconButton onClick={onClose}>
            <X />
          </IconButton>
        </div>
      </DialogTitle>

      {/* Content */}

      <DialogContent className="bg-[#F8FBFA] p-0">
        <div className="mx-auto max-w-4xl">
          {/* Reading Area */}

          <div className="min-h-[550px] bg-white px-10 py-10">
            <div className="mx-auto max-w-3xl">
              {/* Reading Header */}

              <div className="mb-8 border-b border-[#EEF2EF] pb-6">
                <h3 className="text-4xl font-bold leading-tight text-[#173B2F]">
                  {lesson.title}
                </h3>

                <div className="mt-4 h-1 w-24 rounded-full bg-gradient-to-r from-[#173B2F] via-[#C9A95A] to-[#C7A64A]" />
              </div>

              {/* Passage */}

              <div
                className="
                  whitespace-pre-wrap
                  text-[17px]
                  leading-10
                  tracking-wide
                  text-slate-700
                "
              >
                {lesson.content}
              </div>
            </div>
          </div>

          <Divider />

          {/* Footer */}

          <div className="flex flex-col gap-3 bg-white px-8 py-5 sm:flex-row sm:justify-end">
            <Button
              variant="outlined"
              startIcon={<Printer size={18} />}
              sx={{
                borderRadius: "14px",
                borderColor: "#E7ECE8",
                color: "#173B2F",
                textTransform: "none",

                "&:hover": {
                  borderColor: "#C9A95A",
                },
              }}
            >
              Print
            </Button>

            <Button
              variant="contained"
              onClick={onClose}
              sx={{
                background: "#173B2F",
                borderRadius: "14px",
                textTransform: "none",
                px: 4,

                "&:hover": {
                  background: "#215341",
                },
              }}
            >
              Close Preview
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default LessonPreview;
