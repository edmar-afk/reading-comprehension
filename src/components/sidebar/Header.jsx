import {
  AppBar,
  Toolbar,
  IconButton,
  Avatar,
  Badge,
  InputBase,
} from "@mui/material";

import { Bell, Menu, Search, Sun } from "lucide-react";

function Header({ onMenuClick }) {
  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        background: "rgba(255,255,255,.75)",
        backdropFilter: "blur(20px)",
        borderBottom: "1px solid #E2E8F0",
        color: "#0F172A",
      }}
    >
      <Toolbar className="flex h-20 justify-between">
        {/* Left */}
        <div className="flex items-center gap-4">
          {/* Mobile Menu */}
          <IconButton
            onClick={onMenuClick}
            sx={{
              display: {
                xs: "flex",
                sm: "none",
              },
            }}
          >
            <Menu size={24} />
          </IconButton>

          {/* Search */}
          <div
            className="
              hidden
              md:flex
              items-center
              gap-3
              rounded-2xl
              border
              border-slate-200
              bg-slate-50
              px-4
              py-2
              transition
              focus-within:border-indigo-500
              focus-within:bg-white
              w-80
            "
          >
            <Search size={18} className="text-slate-400" />

            <InputBase placeholder="Search..." className="flex-1 text-sm" />
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-2">
          {/* User */}
          <button
            className="
              ml-2
              flex
              items-center
              gap-3
              rounded-2xl
              px-2
              py-2
              transition
              hover:bg-slate-100
            "
          >
            <Avatar
              sx={{
                width: 42,
                height: 42,
              }}
            >
              A
            </Avatar>

            <div className="hidden text-left lg:block">
              <p className="text-sm font-semibold">Administrator</p>

              <p className="text-xs text-slate-500">admin@example.com</p>
            </div>
          </button>
        </div>
      </Toolbar>
    </AppBar>
  );
}

export default Header;
