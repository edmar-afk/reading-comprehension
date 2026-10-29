import React from "react";
import { Bell, ChevronDown } from "lucide-react";

const Header = () => {
  return (
    <header className="flex items-center justify-between pb-6">
      <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>

      <div className="flex items-center gap-6">{/* Notification Icon */}</div>
    </header>
  );
};

export default Header;
