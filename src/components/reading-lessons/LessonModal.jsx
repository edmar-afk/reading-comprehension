import { useMemo, useRef, useState } from "react";

import {
  Button,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";

import { BookOpen, Save, Type, Upload, X, Eye, FileText } from "lucide-react";

function LessonModal({ open, onClose }) {
  const fileInput = useRef(null);

  const [title, setTitle] = useState("");

  const [difficulty, setDifficulty] = useState("Beginner");

  const [mode, setMode] = useState("manual");

  const [content, setContent] = useState("");

  const [fileName, setFileName] = useState("");

  const words = useMemo(() => {
    return content.trim().split(/\s+/).filter(Boolean).length;
  }, [content]);

  const readingTime = Math.max(1, Math.ceil(words / 200));

  const uploadFile = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    setFileName(file.name);

    // backend later
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="lg"
      PaperProps={{
        sx: {
          borderRadius: "24px",
        },
      }}
    >
      <DialogTitle className="flex items-center justify-between border-b border-[#E7ECE8] px-8 py-6">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EAF6F2] text-[#173B2F]">
            <BookOpen size={28} />
          </div>

          <div>
            <h2 className="text-2xl font-bold text-[#173B2F]">
              New Reading Lesson
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Create a reading activity for students.
            </p>
          </div>
        </div>

        <IconButton onClick={onClose}>
          <X />
        </IconButton>
      </DialogTitle>

      <DialogContent className="bg-[#F8FBFA] p-8">
        <div className="space-y-8">
          {/* Title */}

          <div>
            <p className="mb-2 font-semibold text-[#173B2F]">Lesson Title</p>

            <TextField
              fullWidth
              placeholder="Example: The Clever Fox"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "16px",
                  background: "#fff",

                  "& fieldset": {
                    borderColor: "#E7ECE8",
                  },

                  "&:hover fieldset": {
                    borderColor: "#C9A95A",
                  },

                  "&.Mui-focused fieldset": {
                    borderColor: "#173B2F",
                  },
                },
              }}
            />
          </div>

          {/* Difficulty */}

          <div>
            <p className="mb-3 font-semibold text-[#173B2F]">Difficulty</p>

            <div className="flex flex-wrap gap-3">
              {["Beginner", "Intermediate", "Advanced"].map((level) => (
                <Chip
                  key={level}
                  clickable
                  label={level}
                  onClick={() => setDifficulty(level)}
                  sx={{
                    px: 1,
                    bgcolor: difficulty === level ? "#173B2F" : "#FFF8E8",

                    color: difficulty === level ? "#fff" : "#A48A55",

                    fontWeight: 700,
                  }}
                />
              ))}
            </div>
          </div>

          {/* Source */}

          <div>
            <p className="mb-3 font-semibold text-[#173B2F]">Content Source</p>

            <ToggleButtonGroup
              value={mode}
              exclusive
              onChange={(e, value) => value && setMode(value)}
            >
              <ToggleButton value="manual">
                <Type size={18} className="mr-2" />
                Write Lesson
              </ToggleButton>

              <ToggleButton value="upload">
                <Upload size={18} className="mr-2" />
                Upload DOCX/TXT
              </ToggleButton>
            </ToggleButtonGroup>
          </div>

          {/* Upload */}

          {mode === "upload" && (
            <>
              <input
                hidden
                ref={fileInput}
                type="file"
                accept=".docx,.txt"
                onChange={uploadFile}
              />

              <button
                onClick={() => fileInput.current.click()}
                className="flex h-56 w-full flex-col items-center justify-center rounded-3xl border-2 border-dashed border-[#C9A95A] bg-white transition hover:bg-[#FFF8E8]"
              >
                <Upload size={45} className="text-[#173B2F]" />

                <h3 className="mt-4 font-bold text-[#173B2F]">
                  Upload DOCX or TXT
                </h3>

                <p className="mt-2 text-sm text-slate-500">
                  Click or drag your file here
                </p>

                {fileName && (
                  <Chip
                    className="mt-5"
                    icon={<FileText size={14} />}
                    label={fileName}
                  />
                )}
              </button>
            </>
          )}

          {/* Editor */}

          {mode === "manual" && (
            <div>
              <div className="mb-3 flex items-center justify-between">
                <p className="font-semibold text-[#173B2F]">Reading Passage</p>

                <span className="text-sm text-slate-500">
                  {words} words • {readingTime} min read
                </span>
              </div>

              <TextField
                fullWidth
                multiline
                minRows={18}
                placeholder="Start typing your reading lesson..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "20px",
                    background: "#fff",

                    "& fieldset": {
                      borderColor: "#E7ECE8",
                    },

                    "&:hover fieldset": {
                      borderColor: "#C9A95A",
                    },

                    "&.Mui-focused fieldset": {
                      borderColor: "#173B2F",
                    },
                  },
                }}
              />
            </div>
          )}

          <Divider />

          {/* Footer */}

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Button
              variant="outlined"
              onClick={onClose}
              sx={{
                borderRadius: "14px",
                borderColor: "#E7ECE8",
                color: "#173B2F",
              }}
            >
              Cancel
            </Button>

            <Button
              variant="outlined"
              startIcon={<Eye size={18} />}
              sx={{
                borderRadius: "14px",
                borderColor: "#C9A95A",
                color: "#A48A55",
              }}
            >
              Preview
            </Button>

            <Button
              variant="contained"
              startIcon={<Save size={18} />}
              sx={{
                borderRadius: "14px",
                background: "#173B2F",
                px: 4,

                "&:hover": {
                  background: "#215341",
                },
              }}
            >
              Save Lesson
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default LessonModal;
