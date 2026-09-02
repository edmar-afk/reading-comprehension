import { useMemo, useState } from "react";

import DashboardLayout from "../components/sidebar/DashboardLayout";

import LessonToolbar from "../components/reading-lessons/LessonToolbar";
import LessonCard from "../components/reading-lessons/LessonCard";
import LessonModal from "../components/reading-lessons/LessonModal";
import LessonPreview from "../components/reading-lessons/LessonPreview";
import EmptyState from "../components/reading-lessons/EmptyState";
import DeleteLessonDialog from "../components/reading-lessons/DeleteLessonDialog";


const sampleLessons = [
  {
    id: 1,
    title: "The Clever Fox",
    difficulty: "Beginner",
    updatedAt: "2 hours ago",
    content:
      "Once upon a time there was a clever fox that wandered through the forest looking for food. One day, he discovered a farmer's vineyard filled with delicious grapes. He jumped over and over, trying to reach them, but they were too high. After many attempts, he finally gave up and walked away saying, 'Those grapes were probably sour anyway.'",
  },
  {
    id: 2,
    title: "The Lost Puppy",
    difficulty: "Intermediate",
    updatedAt: "Yesterday",
    content:
      "Emma found a frightened puppy sitting under a park bench. She looked around for its owner but couldn't find anyone. She decided to take care of it while asking nearby people if they recognized the dog. Later that afternoon, a little boy came running toward her with tears in his eyes. The puppy wagged its tail happily as soon as it saw him.",
  },
  {
    id: 3,
    title: "The Solar System",
    difficulty: "Advanced",
    updatedAt: "3 days ago",
    content:
      "The Solar System consists of the Sun and the celestial bodies bound to it by gravity. Eight planets orbit the Sun along with dwarf planets, moons, asteroids, and comets. Scientists continue to study these objects to understand how our planetary system formed billions of years ago.",
  },
];

function ReadingLessons() {
  const [lessons, setLessons] = useState(sampleLessons);
  const [deleteLesson, setDeleteLesson] = useState(null);
  const [search, setSearch] = useState("");

  const [difficulty, setDifficulty] = useState("All");

  const [openModal, setOpenModal] = useState(false);

  const [selectedLesson, setSelectedLesson] = useState(null);

  const filteredLessons = useMemo(() => {
    return lessons.filter((lesson) => {
      const matchesSearch =
        lesson.title.toLowerCase().includes(search.toLowerCase()) ||
        lesson.content.toLowerCase().includes(search.toLowerCase());

      const matchesDifficulty =
        difficulty === "All" || lesson.difficulty === difficulty;

      return matchesSearch && matchesDifficulty;
    });
  }, [lessons, search, difficulty]);

  const handleDelete = (lesson) => {
    setDeleteLesson(lesson);
  };

  const confirmDelete = (lesson) => {
    setLessons((prev) => prev.filter((item) => item.id !== lesson.id));

    setDeleteLesson(null);
  };

  const handleEdit = (lesson) => {
    console.log("Edit", lesson);

    // later
    // setSelectedLesson(lesson)
    // setOpenModal(true)
  };

  return (
    <DashboardLayout>
      <LessonToolbar
        search={search}
        setSearch={setSearch}
        difficulty={difficulty}
        setDifficulty={setDifficulty}
        onCreate={() => setOpenModal(true)}
      />

      {filteredLessons.length === 0 ? (
        <EmptyState onCreate={() => setOpenModal(true)} />
      ) : (
        <div className="grid gap-6 md:grid-cols-2 2xl:grid-cols-3">
          {filteredLessons.map((lesson) => (
            <LessonCard
              lesson={lesson}
              onPreview={setSelectedLesson}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Create / Edit */}

      <LessonModal open={openModal} onClose={() => setOpenModal(false)} />

      {/* Preview */}

      <LessonPreview
        open={Boolean(selectedLesson)}
        lesson={selectedLesson}
        onClose={() => setSelectedLesson(null)}
      />

      <DeleteLessonDialog
        open={Boolean(deleteLesson)}
        lesson={deleteLesson}
        onClose={() => setDeleteLesson(null)}
        onConfirm={confirmDelete}
      />
    </DashboardLayout>
  );
}

export default ReadingLessons;
