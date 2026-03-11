"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  Users,
  TrendingUp,
  CheckSquare,
  MessageSquare,
} from "lucide-react";
import Logo from "@/components/ui/Logo";

const items = [
  { href: "/dashboard", label: "Tableau de bord", Icon: LayoutDashboard },
  { href: "/dashboard/companies", label: "Entreprises", Icon: Building2 },
  { href: "/dashboard/contacts", label: "Contacts", Icon: Users },
  { href: "/dashboard/leads", label: "Prospects", Icon: TrendingUp },
  { href: "/dashboard/tasks", label: "Tâches", Icon: CheckSquare },
  { href: "/dashboard/messages", label: "Messages", Icon: MessageSquare },
] as const;

function clsx(...values: Array<string | false | undefined | null>) {
  return values.filter(Boolean).join(" ");
}

export default function Sidebar() {
  const pathname = usePathname() || "";

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-[#0d3d36] border-r border-slate-800 flex flex-col z-40">
      <div className="border-b border-slate-800 pb-3">
        <div className="mx-3 mt-3 p-4 rounded-xl bg-slate-800/70 border border-slate-700 flex items-center gap-3 hover:bg-slate-800 transition">
          <Logo size={56} className="shrink-0" />
          <span className="text-white font-semibold text-lg">FerkousFlow CRM</span>
        </div>
      </div>

      <nav className="px-3 py-4 flex flex-col gap-1.5">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.Icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              aria-label={item.label}
              className={clsx(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-slate-300 hover:bg-slate-800 transition",
                active
                  ? "bg-ferkous-900/40 text-ferkous-400"
                  : ""
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="text-sm font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto p-3 border-t border-slate-800">
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-slate-800/60 transition-colors">
          <div className="h-8 w-8 rounded-full bg-ferkous-900/50 text-ferkous-400 flex items-center justify-center text-xs font-semibold">
            FF
          </div>
          <div className="text-sm text-slate-300">Admin</div>
        </div>
      </div>
    </aside>
  );
}
