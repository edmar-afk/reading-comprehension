import DashboardLayout from "../components/sidebar/DashboardLayout";

import { BookOpen, Users, ChartColumn, Trophy } from "lucide-react";

const cards = [
  {
    title: "Reading Lessons",
    value: "128",
    icon: BookOpen,
    color: "from-[#173B2F] to-[#215341]",
    light: "bg-[#EAF6F2]",
  },
  {
    title: "Students",
    value: "2,534",
    icon: Users,
    color: "from-[#C9A95A] to-[#A48A55]",
    light: "bg-[#FFF8E7]",
  },
  {
    title: "Completed Tests",
    value: "18,245",
    icon: ChartColumn,
    color: "from-[#173B2F] to-[#2A5A49]",
    light: "bg-[#EDF7F3]",
  },
  {
    title: "Average Score",
    value: "92%",
    icon: Trophy,
    color: "from-[#C7A64A] to-[#A48A55]",
    light: "bg-[#FFF6DE]",
  },
];

const overview = [
  {
    title: "Reading Accuracy",
    value: "92%",
    width: "92%",
    gradient: "from-[#173B2F] to-[#2A5A49]",
    description: "Correctly pronounced words",
  },
  {
    title: "Reading Clarity",
    value: "88%",
    width: "88%",
    gradient: "from-[#C9A95A] to-[#A48A55]",
    description: "Clear pronunciation",
  },
  {
    title: "Voice Volume",
    value: "81%",
    width: "81%",
    gradient: "from-[#173B2F] to-[#3A6C5A]",
    description: "Speaking loud enough",
  },
  {
    title: "Reading Fluency",
    value: "90%",
    width: "90%",
    gradient: "from-[#C7A64A] to-[#A48A55]",
    description: "Smooth continuous reading",
  },
  {
    title: "Reading Pace",
    value: "76%",
    width: "76%",
    gradient: "from-[#173B2F] via-[#2E6350] to-[#C9A95A]",
    description: "Words per minute",
  },
  {
    title: "Comprehension",
    value: "94%",
    width: "94%",
    gradient: "from-[#173B2F] to-[#C9A95A]",
    description: "Understanding the passage",
  },
];

function Dashboard() {
  return (
    <DashboardLayout>
      {/* Page Header */}
      <section className="mb-10">
        {/* Badge */}
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#C9A95A]/30 bg-[#FFF8E8] px-4 py-1.5">
          <div className="h-2 w-2 rounded-full bg-[#C9A95A]"></div>
          <span className="text-sm font-semibold tracking-wide text-[#A48A55] uppercase">
            Administrator Dashboard
          </span>
        </div>

        {/* Heading */}
        <h1 className="text-4xl font-bold leading-tight text-[#173B2F]">
          Welcome back,
          <span className="ml-2 text-[#C9A95A]">Administrator</span>
        </h1>

        {/* Description */}
        <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">
          Manage students, organize reading lessons, monitor assessments, and
          gain valuable insights into your platform's performance.
        </p>

        {/* Accent Line */}
        <div className="mt-6 h-1 w-28 rounded-full bg-gradient-to-r from-[#173B2F] via-[#C9A95A] to-[#C7A64A]"></div>
      </section>

      {/* Statistics */}
      <section className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;

          return (
            <div
              key={card.title}
              className="
    group
    relative
    overflow-hidden
    rounded-3xl
    border
    border-[#E8ECE9]
    bg-white
    p-6
    shadow-md
    transition-all
    duration-300
    hover:-translate-y-2
    hover:shadow-2xl
"
            >
              {/* Decorative Background */}
              <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[#173B2F]/5 blur-2xl"></div>

              <div className="relative flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    {card.title}
                  </p>

                  <h2 className="mt-3 text-4xl font-bold text-[#173B2F]">
                    {card.value}
                  </h2>

                  <div className="mt-5 h-1 w-14 rounded-full bg-[#C9A95A]"></div>
                </div>

                <div
                  className={`
        flex
        h-16
        w-16
        items-center
        justify-center
        rounded-2xl
        bg-gradient-to-br
        ${card.color}
        text-white
        shadow-lg
        transition-transform
        duration-300
        group-hover:rotate-6
        group-hover:scale-110
      `}
                >
                  <card.icon size={30} />
                </div>
              </div>
            </div>
          );
        })}
      </section>

      {/* Dashboard Content */}

      <section className="mt-8 grid gap-6 lg:grid-cols-3 lg:items-stretch">
        {/* Recent Activity */}
        <div className="relative flex h-[450px] flex-col overflow-hidden rounded-3xl border border-[#E7ECE8] bg-white p-6 shadow-md lg:col-span-2 lg:h-[550px]">
          {/* Decorative Background */}
          <div className="absolute -right-20 -top-20 h-52 w-52 rounded-full bg-[#173B2F]/5 blur-3xl"></div>

          <div className="relative flex h-full flex-col">
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-[#173B2F]">
                  Recent Activity
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Latest activities from students.
                </p>
              </div>

              <div className="h-10 w-1 rounded-full bg-[#C9A95A]"></div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 space-y-4 overflow-y-auto pr-2">
              {[...Array(20)].map((_, index) => (
                <div
                  key={index}
                  className="
              group
              flex
              items-center
              justify-between
              rounded-2xl
              border
              border-[#EEF2EF]
              bg-[#F8FBFA]
              p-4
              transition-all
              duration-300
              hover:border-[#C9A95A]
              hover:bg-white
              hover:shadow-lg
            "
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#173B2F] font-bold text-white">
                      {index + 1}
                    </div>

                    <div>
                      <p className="font-semibold text-[#173B2F]">
                        Student completed Reading Test #{index + 1}
                      </p>

                      <p className="mt-1 text-sm text-slate-500">
                        5 minutes ago
                      </p>
                    </div>
                  </div>

                  <span className="rounded-full bg-[#FFF8E6] px-4 py-2 text-xs font-semibold text-[#A48A55]">
                    Completed
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Overall Overview */}
        <div className="relative flex h-[450px] flex-col overflow-hidden rounded-3xl border border-[#E7ECE8] bg-white p-6 shadow-md lg:h-[550px]">
          <div className="absolute -left-16 -bottom-16 h-40 w-40 rounded-full bg-[#C9A95A]/10 blur-3xl"></div>

          <div className="relative flex h-full flex-col">
            {/* Header */}
            <div>
              <h2 className="text-xl font-bold text-[#173B2F]">
                Overall Overview
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Average students' performance.
              </p>
            </div>

            {/* Scrollable Content */}
            <div className="mt-8 flex-1 space-y-6 overflow-y-auto pr-2">
              {overview.map((item) => (
                <div
                  key={item.title}
                  className="rounded-2xl border border-[#EEF2EF] bg-[#FBFCFB] p-4 transition-all duration-300 hover:border-[#C9A95A] hover:shadow-md"
                >
                  <div className="mb-3 flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold text-[#173B2F]">
                        {item.title}
                      </h4>

                      <p className="mt-1 text-xs text-slate-500">
                        {item.description}
                      </p>
                    </div>

                    <span className="rounded-full bg-[#FFF8E8] px-3 py-1 text-sm font-bold text-[#A48A55]">
                      {item.value}
                    </span>
                  </div>

                  <div className="h-2.5 overflow-hidden rounded-full bg-[#E6ECE9]">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${item.gradient}`}
                      style={{ width: item.width }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </DashboardLayout>
  );
}

export default Dashboard;
