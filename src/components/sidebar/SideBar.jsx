import { Drawer, IconButton } from "@mui/material";
import { X } from "lucide-react";

import Logo from "./Logo";
import SideBarItem from "./SideBarItem";

import {
  LayoutDashboard,
  BookOpen,
  Users,
  ChartColumn,
  LogOut,
} from "lucide-react";

import { Link } from "react-router-dom";

const drawerWidth = 300;

const menus = [
  {
    title: "MAIN",
    items: [
      {
        title: "Dashboard",
        icon: LayoutDashboard,
        to: "/dashboard",
        superuserOnly: true,
      },
      {
        title: "Reading Materials",
        icon: BookOpen,
        to: "/reading-materials",
      },
      {
        title: "Students",
        icon: Users,
        to: "/students",
        superuserOnly: true,
      },
      {
        title: "Analytics",
        icon: ChartColumn,
        to: "/analytics",
        superuserOnly: true,
      },
    ],
  },
];

function Sidebar({ open, onClose }) {
  // GET USER INFORMATION FROM LOCAL STORAGE
  let userData = {};

  try {
    userData = JSON.parse(localStorage.getItem("userInfo") || "{}");
  } catch (error) {
    console.error("Failed to read userData:", error);
  }

  const isSuperuser = userData?.is_superuser === true;

  // FILTER MENUS BASED ON USER ROLE
  const filteredMenus = menus
    .map((group) => ({
      ...group,
      items: group.items.filter(
        (item) => !item.superuserOnly || isSuperuser
      ),
    }))
    .filter((group) => group.items.length > 0);

  const content = (
    <div className="flex h-full flex-col">
      {/* LOGO */}
      <div className="sticky top-0 z-20 bg-white/90 px-6 py-6 backdrop-blur-xl">
        {/* MOBILE CLOSE */}
        <div className="mb-5 flex justify-end lg:hidden">
          <IconButton onClick={onClose}>
            <X size={22} />
          </IconButton>
        </div>

        <Logo />
      </div>

      {/* NAVIGATION */}
      <div className="flex-1 overflow-y-auto px-4 pb-6">
        {filteredMenus.map((group) => (
          <div key={group.title} className="mt-8">
            <p className="mb-3 px-4 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              {group.title}
            </p>

            <div className="space-y-1">
              {group.items.map((item) => (
                <SideBarItem
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

      {/* FOOTER */}
      <div className="border-t border-slate-200 p-4">
        <Link
          to="/logout"
          onClick={onClose}
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
        </Link>
      </div>
    </div>
  );

  return (
    <>
      {/* DESKTOP */}
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
        <div className="h-full rounded-3xl bg-white shadow-xl">
          {content}
        </div>
      </Drawer>

      {/* MOBILE */}
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
        <div className="h-full rounded-3xl bg-white shadow-xl">
          {content}
        </div>
      </Drawer>
    </>
  );
}

export default Sidebar;
