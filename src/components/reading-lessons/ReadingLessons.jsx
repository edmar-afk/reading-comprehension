/* eslint-disable no-unused-vars */
import { useState } from "react";

import DashboardLayout from "../layout/DashboardLayout";

import LessonToolbar from "./LessonToolbar";
import LessonModal from "./LessonModal";
import LessonCard from "./LessonCard";
import LessonPreview from "./LessonPreview";
import EmptyState from "./EmptyState";

function ReadingLessons() {
  const [lessons, setLessons] = useState([]);

  const [search, setSearch] = useState("");

  const [difficulty, setDifficulty] = useState("All");

  const [openModal, setOpenModal] = useState(false);

  const [preview, setPreview] = useState(null);

  const filtered = lessons.filter((lesson) => {
    const matchesSearch = lesson.title
      .toLowerCase()
      .includes(search.toLowerCase());

    const matchesDifficulty =
      difficulty === "All" || lesson.difficulty === difficulty;

    return matchesSearch && matchesDifficulty;
  });

  return (
    <DashboardLayout>
      <LessonToolbar
        search={search}
        setSearch={setSearch}
        difficulty={difficulty}
        setDifficulty={setDifficulty}
        onCreate={() => setOpenModal(true)}
      />

      {filtered.length === 0 ? (
        <EmptyState onCreate={() => setOpenModal(true)} />
      ) : (
        <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
          {filtered.map((lesson) => (
            <LessonCard
              key={lesson.id}
              lesson={lesson}
              onPreview={setPreview}
              onEdit={() => {}}
              onDelete={() => {}}
            />
          ))}
        </div>
      )}

      <LessonModal open={openModal} onClose={() => setOpenModal(false)} />

      <LessonPreview
        open={Boolean(preview)}
        lesson={preview}
        onClose={() => setPreview(null)}
      />
    </DashboardLayout>
  );
}

export default ReadingLessons;
