"use client";

import { useState } from "react";
import { Bell, Search } from "lucide-react";
import LogoutButton from "@/components/ui/LogoutButton";

const tabs = ["Statut", "Marketing", "Ventes", "Requêtes"] as const;

function clsx(...values: Array<string | false | undefined | null>) {
  return values.filter(Boolean).join(" ");
}

export default function Topbar() {
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>("Statut");

  return (
    <div className="sticky top-0 z-30 bg-gray-50/80 dark:bg-slate-950/80 backdrop-blur border-b border-gray-200 dark:border-slate-800 transition-colors">
      <div className="px-6 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="flex bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-1 shadow-sm">
            {tabs.map((tab) => {
              const active = activeTab === tab;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={clsx(
                    "px-3 py-1.5 rounded-xl text-sm font-semibold transition-all",
                    active
                      ? "bg-[#0d3d36] text-white"
                      : "text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-100 hover:bg-gray-50 dark:hover:bg-slate-800"
                  )}
                >
                  {tab}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl px-3 py-2 shadow-sm w-[320px]">
            <Search className="h-4 w-4 text-gray-400 dark:text-slate-500" />
            <input
              className="w-full outline-none text-sm text-gray-900 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500 bg-transparent border-0 p-0"
              placeholder="Rechercher (entreprise, contact, prospect...)"
            />
          </div>

          <div className="flex items-center gap-4">
            <LogoutButton />
          </div>

          <button
            title="Notifications"
            aria-label="Notifications"
            className="relative h-10 w-10 rounded-2xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 shadow-sm hover:shadow transition flex items-center justify-center"
          >
            <Bell className="h-5 w-5 text-gray-700 dark:text-slate-200" />
            <span className="absolute -top-1 -right-1 h-5 min-w-[20px] px-1 rounded-full bg-[#f97316] text-white text-[11px] flex items-center justify-center font-bold">
              3
            </span>
          </button>

          <div className="h-10 w-10 rounded-2xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 shadow-sm flex items-center justify-center">
            <div className="h-7 w-7 rounded-full bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700" />
          </div>
        </div>
      </div>
    </div>
  );
}
