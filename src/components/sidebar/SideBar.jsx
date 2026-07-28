import { Drawer, IconButton } from "@mui/material";
import { X } from "lucide-react";

import Logo from "./Logo";
import SidebarItem from "./SidebarItem";

import {
  LayoutDashboard,
  BookOpen,
  Users,
  ChartColumn,
  Settings,
  LogOut,
} from "lucide-react";

const drawerWidth = 300;

const menus = [
  {
    title: "MAIN",
    items: [
      {
        title: "Dashboard",
        icon: LayoutDashboard,
        to: "/dashboard",
      },
      {
        title: "Reading Lessons",
        icon: BookOpen,
        to: "/reading-lessons",
      },
      {
        title: "Students",
        icon: Users,
        to: "/students",
      },
      {
        title: "Analytics",
        icon: ChartColumn,
        to: "/analytics",
      },
    ],
  },
  {
    title: "SYSTEM",
    items: [
      {
        title: "Profile Settings",
        icon: Settings,
        to: "/settings",
      },
    ],
  },
];

function Sidebar({ open, onClose }) {
  const content = (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="sticky top-0 z-20 bg-white/90 backdrop-blur-xl px-6 py-6">
        {/* Mobile Close */}
        <div className="mb-5 flex justify-end lg:hidden">
          <IconButton onClick={onClose}>
            <X size={22} />
          </IconButton>
        </div>

        <Logo />
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-4 pb-6">
        {menus.map((group) => (
          <div key={group.title} className="mt-8">
            <p className="mb-3 px-4 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              {group.title}
            </p>

            <div className="space-y-1">
              {group.items.map((item) => (
                <SidebarItem
                  key={item.title}
                  title={item.title}
                  icon={item.icon}
                  to={item.to}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="border-t border-slate-200 p-4">
        <button
          className="
            flex
            w-full
            items-center
            gap-3
            rounded-2xl
            px-4
            py-3
            text-red-500
            transition-all
            hover:bg-red-50
          "
        >
          <LogOut size={20} />

          <span className="text-sm font-medium">Logout</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop */}
      <Drawer
        variant="permanent"
        PaperProps={{
          sx: {
            width: drawerWidth,
            boxSizing: "border-box",
            background: "#F8FAFC",
            border: "none",
            padding: "16px",
          },
        }}
        className="hidden lg:block"
      >
        <div className="h-full rounded-3xl bg-white shadow-xl">{content}</div>
      </Drawer>

      {/* Mobile */}
      <Drawer
        open={open}
        onClose={onClose}
        variant="temporary"
        ModalProps={{
          keepMounted: true,
        }}
        PaperProps={{
          sx: {
            width: drawerWidth,
            background: "#F8FAFC",
            border: "none",
            padding: "16px",
          },
        }}
        className="lg:hidden"
      >
        <div className="h-full rounded-3xl bg-white shadow-xl">{content}</div>
      </Drawer>
    </>
  );
}

export default Sidebar;
