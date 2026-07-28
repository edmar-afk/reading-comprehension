import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
} from "@mui/material";

import {
  TriangleAlert,
  Trash2,
  X,
} from "lucide-react";

function DeleteLessonDialog({
  open,
  lesson,
  onClose,
  onConfirm,
}) {
  if (!lesson) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: "24px",
          overflow: "hidden",
        },
      }}
    >
      {/* Header */}

      <DialogTitle className="relative border-b border-[#E7ECE8] bg-white px-6 py-5">

        <div className="flex items-center gap-4">

          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50">

            <TriangleAlert
              size={28}
              className="text-red-600"
            />

          </div>

          <div>

            <h2 className="text-2xl font-bold text-[#173B2F]">
              Delete Lesson
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              This action cannot be undone.
            </p>

          </div>

        </div>

        <IconButton
          onClick={onClose}
          className="!absolute right-4 top-4"
        >
          <X size={20} />
        </IconButton>

      </DialogTitle>

      {/* Body */}

      <DialogContent className="bg-[#F8FBFA] px-6 py-8">

        <div className="rounded-2xl border border-[#E7ECE8] bg-white p-5">

          <p className="text-slate-600">
            Are you sure you want to permanently delete
            this reading lesson?
          </p>

          <div className="mt-5 rounded-xl border border-[#FFF0D6] bg-[#FFF8E8] p-4">

            <p className="text-xs font-semibold uppercase tracking-wider text-[#A48A55]">
              Lesson
            </p>

            <h3 className="mt-2 text-lg font-bold text-[#173B2F]">
              {lesson.title}
            </h3>

          </div>

        </div>

      </DialogContent>

      {/* Footer */}

      <DialogActions className="border-t border-[#E7ECE8] bg-white px-6 py-5">

        <Button
          onClick={onClose}
          variant="outlined"
          sx={{
            borderRadius: "14px",
            borderColor: "#E7ECE8",
            color: "#173B2F",
            textTransform: "none",
            px: 3,

            "&:hover": {
              borderColor: "#C9A95A",
            },
          }}
        >
          Cancel
        </Button>

        <Button
          onClick={() => onConfirm(lesson)}
          variant="contained"
          startIcon={<Trash2 size={18} />}
          sx={{
            background: "#DC2626",
            borderRadius: "14px",
            textTransform: "none",
            px: 3,

            "&:hover": {
              background: "#B91C1C",
            },
          }}
        >
          Delete Lesson
        </Button>

      </DialogActions>
    </Dialog>
  );
}

export default DeleteLessonDialog;