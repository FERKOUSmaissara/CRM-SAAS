"use client";

import { useMemo } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import type { DashboardData } from "@/hooks/useDashboardData";

type Props = {
  data: DashboardData;
};

const statusColors = ["#00c9a7", "#14b8a6", "#22c55e", "#f97316"];
const sourceColors = ["#00c9a7", "#14b8a6", "#3b82f6", "#64748b", "#f59e0b"];

export default function AnalyticsDashboardSection({ data }: Props) {
  const revenueData = useMemo(() => {
    const monthMap = new Map<string, { monthLabel: string; monthDate: Date; revenue: number }>();

    data.leads.forEach((lead) => {
      if (lead.status !== "converted" || !lead.created_at) return;

      const createdAt = new Date(lead.created_at);
      if (Number.isNaN(createdAt.getTime())) return;

      const key = `${createdAt.getFullYear()}-${createdAt.getMonth()}`;
      const existing = monthMap.get(key);
      const revenue = lead.estimated_value || 0;

      if (existing) {
        existing.revenue += revenue;
        return;
      }

      monthMap.set(key, {
        monthLabel: new Intl.DateTimeFormat("fr-FR", { month: "short" }).format(createdAt),
        monthDate: new Date(createdAt.getFullYear(), createdAt.getMonth(), 1),
        revenue,
      });
    });

    return Array.from(monthMap.values())
      .sort((a, b) => a.monthDate.getTime() - b.monthDate.getTime())
      .map((item) => ({ month: item.monthLabel, revenue: item.revenue }));
  }, [data.leads]);

  const pipelineData = useMemo(() => {
    const stageConfig = [
      { status: "new", stage: "Prospect" },
      { status: "in_progress", stage: "En cours" },
      { status: "proposal", stage: "Proposition" },
      { status: "negotiation", stage: "Négociation" },
      { status: "converted", stage: "Converti" },
      { status: "lost", stage: "Perdu" },
    ];

    const counts: Record<string, number> = {
      new: 0,
      in_progress: 0,
      proposal: 0,
      negotiation: 0,
      converted: 0,
      lost: 0,
    };

    data.leads.forEach((lead) => {
      const status = (lead.status || "new").toLowerCase();
      if (status in counts) counts[status] += 1;
    });

    return stageConfig.map((stage) => ({ stage: stage.stage, value: counts[stage.status] || 0 }));
  }, [data.leads]);

  const leadsStatusData = useMemo(() => {
    const counts = {
      new: 0,
      in_progress: 0,
      converted: 0,
      lost: 0,
    };

    data.leads.forEach((lead) => {
      const status = (lead.status || "new").toLowerCase();
      if (status in counts) {
        counts[status as keyof typeof counts] += 1;
      }
    });

    return [
      { name: "Nouveau", value: counts.new },
      { name: "En cours", value: counts.in_progress },
      { name: "Converti", value: counts.converted },
      { name: "Perdu", value: counts.lost },
    ];
  }, [data.leads]);

  const salesPerformance = useMemo(() => {
    const userNameById = new Map(data.leaderboard.map((row) => [row.userId, row.name]));
    const salesByUser = new Map<string, { name: string; sales: number }>();

    data.leads.forEach((lead) => {
      if (lead.status !== "converted") return;

      const userId = lead.assigned_to || "unassigned";
      const name = userNameById.get(userId) || (userId === "unassigned" ? "Non assigné" : userId);
      const existing = salesByUser.get(userId);

      if (existing) {
        existing.sales += 1;
        return;
      }

      salesByUser.set(userId, { name, sales: 1 });
    });

    return Array.from(salesByUser.values()).sort((a, b) => b.sales - a.sales);
  }, [data.leads, data.leaderboard]);

  const activityData = useMemo(() => {
    const taskText = (taskTitle: string | null, taskDescription: string | null) =>
      `${taskTitle || ""} ${taskDescription || ""}`.toLowerCase();

    const emailsFromTasks = data.tasks.filter((task) => {
      const value = taskText(task.title, task.description);
      return value.includes("email") || value.includes("mail");
    }).length;

    const callsFromTasks = data.tasks.filter((task) => {
      const value = taskText(task.title, task.description);
      return value.includes("call") || value.includes("appel") || value.includes("phone") || value.includes("téléphone");
    }).length;

    const meetingsFromTasks = data.tasks.filter((task) => {
      const value = taskText(task.title, task.description);
      return value.includes("meeting") || value.includes("rdv") || value.includes("rendez");
    }).length;

    const emailsFromLeads = data.leads.filter((lead) => {
      const source = (lead.source || "").toLowerCase();
      return source.includes("email") || source.includes("mail");
    }).length;

    const callsFromLeads = data.leads.filter((lead) => {
      const source = (lead.source || "").toLowerCase();
      return source.includes("call") || source.includes("appel");
    }).length;

    const meetingsFromLeads = data.leads.filter((lead) => {
      const status = (lead.status || "").toLowerCase();
      return status === "in_progress" || status === "proposal" || status === "negotiation";
    }).length;

    return [
      { type: "Emails", value: emailsFromTasks + emailsFromLeads },
      { type: "Appels", value: callsFromTasks + callsFromLeads },
      { type: "Rendez-vous", value: meetingsFromTasks + meetingsFromLeads },
      { type: "Tâches", value: data.tasks.length },
    ];
  }, [data.tasks, data.leads]);

  const leadsSourceData = useMemo(() => {
    const counts = {
      Google: 0,
      Facebook: 0,
      LinkedIn: 0,
      Direct: 0,
      Events: 0,
    };

    data.leads.forEach((lead) => {
      const source = (lead.source || "").toLowerCase();

      if (source.includes("google")) {
        counts.Google += 1;
        return;
      }
      if (source.includes("facebook") || source.includes("meta")) {
        counts.Facebook += 1;
        return;
      }
      if (source.includes("linkedin")) {
        counts.LinkedIn += 1;
        return;
      }
      if (source.includes("event") || source.includes("salon") || source.includes("webinar")) {
        counts.Events += 1;
        return;
      }

      counts.Direct += 1;
    });

    return [
      { name: "Google", value: counts.Google },
      { name: "Facebook", value: counts.Facebook },
      { name: "LinkedIn", value: counts.LinkedIn },
      { name: "Direct", value: counts.Direct },
      { name: "Événements", value: counts.Events },
    ];
  }, [data.leads]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      <div className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow">
        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-4">Croissance du CA</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="month" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip />
              <Line type="monotone" dataKey="revenue" stroke="#00c9a7" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow">
        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-4">Pipeline commercial</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={pipelineData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="stage" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip />
              <Bar dataKey="value" fill="#00c9a7" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow">
        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-4">Répartition des statuts prospects</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={leadsStatusData} dataKey="value" nameKey="name" outerRadius={85}>
                {leadsStatusData.map((entry, index) => (
                  <Cell key={`status-${entry.name}`} fill={statusColors[index % statusColors.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow">
        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-4">Performance de l'équipe commerciale</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={salesPerformance}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="name" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip />
              <Bar dataKey="sales" fill="#00c9a7" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow">
        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-4">Activité CRM</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={activityData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="type" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip />
              <Bar dataKey="value" fill="#00c9a7" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow">
        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-4">Sources des prospects</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={leadsSourceData} dataKey="value" nameKey="name" outerRadius={85}>
                {leadsSourceData.map((entry, index) => (
                  <Cell key={`source-${entry.name}`} fill={sourceColors[index % sourceColors.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
