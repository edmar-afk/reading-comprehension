import { useState } from "react";

import SideBar from "./SideBar";
import Header from "./Header";

function DashboardLayout({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
   <div className="min-h-screen bg-slate-100">
      {/* SideBar */}
      <SideBar open={mobileOpen} onClose={() => setMobileOpen(false)} />

      {/* Main */}
      <div className="lg:ml-[300px]">
        <Header onMenuClick={() => setMobileOpen(true)} />

        <main className="p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}

export default DashboardLayout;
