import { Button } from "@mui/material";
import {
  BookOpen,
  Plus,
} from "lucide-react";

function EmptyState({ onCreate }) {
  return (
    <div className="flex min-h-[450px] flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-300 bg-white">

      <div className="rounded-full bg-indigo-100 p-6">

        <BookOpen
          size={42}
          className="text-indigo-600"
        />

      </div>

      <h2 className="mt-6 text-2xl font-bold">

        No Reading Lessons

      </h2>

      <p className="mt-3 max-w-md text-center text-slate-500">

        Create your first reading lesson by typing
        manually or importing a DOCX/TXT document.

      </p>

      <Button
        className="mt-8"
        variant="contained"
        startIcon={<Plus size={18} />}
        onClick={onCreate}
      >
        Create Lesson
      </Button>

    </div>
  );
}

export default EmptyState;