import React from "react";
import Sidebar from "@/components/ui/Sidebar";
import Topbar from "@/components/ui/Topbar";

export const metadata = { title: "Tableau de bord" };

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 transition-colors overflow-x-hidden">
      <div className="flex">
        <Sidebar />
        <main className="ml-64 flex-1 min-h-screen overflow-x-hidden">
          <Topbar />
          <div className="px-6 py-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
