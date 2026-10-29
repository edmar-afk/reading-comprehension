import React from "react";
import Header from "../components/dashboard/Header";
import Stats from "../components/dashboard/Stats";
import RecentSubmissions from "../components/dashboard/RecentSubmission";
import PerformanceOverview from "../components/dashboard/PerformanceOverview";
import SideBar from "../components/sidebar/SideBar";

const Dashboard = () => {
  return (
    <>
      <SideBar />
      <div className="flex-1 min-h-screen bg-[#F8FAFC] p-6 lg:p-8 overflow-y-auto ml-72">
        {/* Header */}
        <Header />

        {/* Top Quick Stats */}
        <Stats />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          <RecentSubmissions />
          <PerformanceOverview />
        </div>
      </div>
    </>
  );
};

export default Dashboard;
