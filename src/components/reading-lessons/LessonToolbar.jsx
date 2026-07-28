import { Button, MenuItem, TextField, InputAdornment } from "@mui/material";

import { Search, Plus, Filter } from "lucide-react";

function LessonToolbar({
  search,
  setSearch,
  difficulty,
  setDifficulty,
  onCreate,
}) {
  return (
    <section className="mb-10">
      {/* Badge */}
      <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#C9A95A]/30 bg-[#FFF8E8] px-4 py-1.5">
        <div className="h-2 w-2 rounded-full bg-[#C9A95A]" />

        <span className="text-sm font-semibold uppercase tracking-wider text-[#A48A55]">
          Reading Management
        </span>
      </div>

      {/* Heading */}
      <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h1 className="text-4xl font-bold leading-tight text-[#173B2F]">
            Reading Lessons
          </h1>

          <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">
            Create, organize, and manage reading passages that students will
            read during their assessments.
          </p>

          <div className="mt-6 h-1 w-28 rounded-full bg-gradient-to-r from-[#173B2F] via-[#C9A95A] to-[#C7A64A]" />
        </div>

        {/* New Lesson */}
        <Button
          variant="contained"
          startIcon={<Plus size={18} />}
          onClick={onCreate}
          sx={{
            background: "#173B2F",
            color: "#fff",
            textTransform: "none",
            fontWeight: 600,
            borderRadius: "16px",
            px: 3,
            py: 1.5,
            minWidth: 180,
            boxShadow: "0 10px 25px rgba(23,59,47,.18)",

            "&:hover": {
              background: "#215341",
              boxShadow: "0 14px 30px rgba(23,59,47,.28)",
            },
          }}
        >
          New Lesson
        </Button>
      </div>

      {/* Search + Filter Card */}
      <div className="mt-8 rounded-3xl border border-[#E7ECE8] bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row">
          {/* Search */}

          <TextField
            fullWidth
            placeholder="Search title or lesson content..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search size={18} className="text-[#A48A55]" />
                </InputAdornment>
              ),
            }}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: "16px",
                background: "#F8FBFA",

                "& fieldset": {
                  borderColor: "#E7ECE8",
                },

                "&:hover fieldset": {
                  borderColor: "#C9A95A",
                },

                "&.Mui-focused fieldset": {
                  borderColor: "#173B2F",
                  borderWidth: "2px",
                },
              },
            }}
          />

          {/* Difficulty */}

          <TextField
            select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            sx={{
              width: {
                xs: "100%",
                lg: 220,
              },

              "& .MuiOutlinedInput-root": {
                borderRadius: "16px",
                background: "#F8FBFA",

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
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Filter size={18} className="text-[#A48A55]" />
                </InputAdornment>
              ),
            }}
          >
            <MenuItem value="All">All Difficulties</MenuItem>

            <MenuItem value="Beginner">Beginner</MenuItem>

            <MenuItem value="Intermediate">Intermediate</MenuItem>

            <MenuItem value="Advanced">Advanced</MenuItem>
          </TextField>
        </div>
      </div>
    </section>
  );
}

export default LessonToolbar;
