"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { fetchTasksForOwner, getTaskTimelineStats, type TaskRow } from "@/lib/tasks";
import { CRM_ENTITY_DELETED_EVENT } from "@/lib/deleteEntity";

type LeadStatus = "new" | "in_progress" | "converted" | "lost";

type CompanyRaw = {
  id: string;
  name: string | null;
  industry: string | null;
  created_at: string | null;
  contacts?: Array<{ id: string }> | null;
  leads?: Array<{ id: string; status: LeadStatus | null; estimated_value: number | null; created_at: string | null }> | null;
};

type ContactRow = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  created_at: string | null;
  company_id: string | null;
  companies?: { name: string | null } | null;
};

type LeadRow = {
  id: string;
  title: string | null;
  email: string | null;
  status: LeadStatus | null;
  estimated_value: number | null;
  source: string | null;
  created_at: string | null;
  company_id: string | null;
  companies?: { name: string | null } | null;
  assigned_to: string | null;
};

type ProfileRow = {
  id: string;
  full_name: string | null;
  role: string | null;
};

type CompanyView = CompanyRaw & {
  totalContacts: number;
  totalLeads: number;
  pipelineValue: number;
  isActive: boolean;
};

type FunnelRow = { name: string; status: LeadStatus; value: number };
type SourceRow = { source: string; count: number };
type ActivityRow = { type: "lead" | "task"; title: string | null; date: string | null };

type LeaderboardRow = {
  userId: string;
  name: string;
  assigned: number;
  converted: number;
  pipeline: number;
  winRate: number;
};

type DashboardKpis = {
  pipelineTotal: number;
  pipelineVariation: number;
  conversionRate: number;
  conversionVariation: number;
  totalCompanies: number;
  overdueTasks: number;
  monthRevenue: number;
  monthRevenueVariation: number;
  objectiveReachedPct: number;
  newLeadsThisMonth: number;
  meetingsToday: number;
  urgentTasks: number;
};

export type DashboardData = {
  kpis: DashboardKpis;
  companies: CompanyView[];
  contacts: ContactRow[];
  leads: LeadRow[];
  tasks: TaskRow[];
  funnel: { total: number; data: FunnelRow[] };
  leaderboard: LeaderboardRow[];
  marketing: { leadsBySource: SourceRow[]; leadsByStatus: FunnelRow[] };
  finance: { forecast: number; paid: number; unpaid: number };
  activity: ActivityRow[];
  uid?: string | null;
};

const initialData: DashboardData = {
  kpis: {
    pipelineTotal: 0,
    pipelineVariation: 0,
    conversionRate: 0,
    conversionVariation: 0,
    totalCompanies: 0,
    overdueTasks: 0,
    monthRevenue: 0,
    monthRevenueVariation: 0,
    objectiveReachedPct: 0,
    newLeadsThisMonth: 0,
    meetingsToday: 0,
    urgentTasks: 0,
  },
  companies: [],
  contacts: [],
  leads: [],
  tasks: [],
  funnel: { total: 0, data: [] },
  leaderboard: [],
  marketing: { leadsBySource: [], leadsByStatus: [] },
  finance: { forecast: 0, paid: 0, unpaid: 0 },
  activity: [],
};

export function useDashboardData() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData>(initialData);
  const loadingRef = useRef(false);
  const mountedRef = useRef(true);

  const formatCurrency = useMemo(
    () =>
      (value: number) =>
        new Intl.NumberFormat("fr-FR", {
          style: "currency",
          currency: "EUR",
          maximumFractionDigits: 0,
        }).format(value),
    []
  );

  const formatVariation = useMemo(
    () => (value: number, suffix = "") => {
      const isPositive = value >= 0;
      const sign = isPositive ? "+" : "-";
      const arrow = isPositive ? "↑" : "↓";
      return {
        text: `${arrow} ${sign}${Math.abs(value).toFixed(1)}${suffix}`,
        color: isPositive ? "text-ferkous-500" : "text-red-500",
      };
    },
    []
  );

  const loadDashboardData = useCallback(async () => {
    try {
      const now = new Date();
      const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfPreviousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfPreviousMonth = new Date(now.getFullYear(), now.getMonth(), 0);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      const uid = user?.id || null;

      const { data: companiesRaw } = await supabase
        .from("companies")
        .select("id,name,industry,created_at,contacts(id),leads(id,status,estimated_value,created_at)")
        .order("created_at", { ascending: false });

      const { data: contactsRaw } = await supabase
        .from("contacts")
        .select("id,first_name,last_name,email,phone,created_at,company_id,companies(name)")
        .order("created_at", { ascending: false })
        .limit(15);

      const { data: leadsRaw } = await supabase
        .from("leads")
        .select("id,title,email,status,estimated_value,source,created_at,company_id,companies(name),assigned_to")
        .order("created_at", { ascending: false });

      const tasks = uid ? await fetchTasksForOwner(uid) : [];

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id,full_name,role")
        .in("role", ["commercial", "admin"]);

      const companies = ((companiesRaw || []) as CompanyRaw[]).map((c) => {
        const totalContacts = c.contacts?.length || 0;
        const totalLeads = c.leads?.length || 0;
        const pipelineValue =
          c.leads
            ?.filter((l) => l.status !== "lost")
            .reduce((sum, l) => sum + (l.estimated_value || 0), 0) || 0;

        const isActive = totalContacts > 0 || (c.leads || []).some((l) => l.status !== "lost");

        return { ...c, totalContacts, totalLeads, pipelineValue, isActive };
      });

      const leads = (leadsRaw || []) as LeadRow[];
        const taskTimeline = getTaskTimelineStats(tasks, now);

      const pipelineTotal =
        leads
          .filter((l) => l.status !== "lost")
          .reduce((sum, l) => sum + (l.estimated_value || 0), 0) || 0;

      const currentMonthPipeline =
        leads
          .filter((l) => l.created_at && new Date(l.created_at) >= startOfCurrentMonth && l.status !== "lost")
          .reduce((sum, l) => sum + (l.estimated_value || 0), 0) || 0;

      const previousMonthPipeline =
        leads
          .filter(
            (l) =>
              l.created_at &&
              new Date(l.created_at) >= startOfPreviousMonth &&
              new Date(l.created_at) <= endOfPreviousMonth &&
              l.status !== "lost"
          )
          .reduce((sum, l) => sum + (l.estimated_value || 0), 0) || 0;

      const pipelineVariation =
        previousMonthPipeline > 0
          ? ((currentMonthPipeline - previousMonthPipeline) / previousMonthPipeline) * 100
          : 0;

      const converted = leads.filter((l) => l.status === "converted").length;
      const conversionRate = leads.length > 0 ? (converted / leads.length) * 100 : 0;

      const currentMonthLeads = leads.filter((l) => l.created_at && new Date(l.created_at) >= startOfCurrentMonth);
      const prevMonthLeads = leads.filter(
        (l) =>
          l.created_at &&
          new Date(l.created_at) >= startOfPreviousMonth &&
          new Date(l.created_at) <= endOfPreviousMonth
      );

      const cmConv = currentMonthLeads.length
        ? (currentMonthLeads.filter((l) => l.status === "converted").length / currentMonthLeads.length) * 100
        : 0;

      const pmConv = prevMonthLeads.length
        ? (prevMonthLeads.filter((l) => l.status === "converted").length / prevMonthLeads.length) * 100
        : 0;

      const conversionVariation = cmConv - pmConv;

      const overdueTasks = taskTimeline.overdueCount;
      const urgentTasks = taskTimeline.overdueCount + taskTimeline.todayCount;

      const meetingsToday = taskTimeline.todayTasks.filter((t) => {
        const title = (t.title || "").toLowerCase();
        return title.includes("rdv") || title.includes("meeting") || title.includes("rendez");
      }).length;

      const monthRevenue =
        leads
          .filter((l) => l.created_at && new Date(l.created_at) >= startOfCurrentMonth && l.status === "converted")
          .reduce((sum, l) => sum + (l.estimated_value || 0), 0) || 0;

      const prevMonthRevenue =
        leads
          .filter(
            (l) =>
              l.created_at &&
              new Date(l.created_at) >= startOfPreviousMonth &&
              new Date(l.created_at) <= endOfPreviousMonth &&
              l.status === "converted"
          )
          .reduce((sum, l) => sum + (l.estimated_value || 0), 0) || 0;

      const monthRevenueVariation =
        prevMonthRevenue > 0 ? ((monthRevenue - prevMonthRevenue) / prevMonthRevenue) * 100 : 0;

      const objectiveTarget = 50000;
      const objectiveReachedPct = objectiveTarget > 0 ? Math.min((monthRevenue / objectiveTarget) * 100, 100) : 0;

      const newLeadsThisMonth = currentMonthLeads.length;

      const counts: Record<LeadStatus, number> = {
        new: leads.filter((l) => l.status === "new").length,
        in_progress: leads.filter((l) => l.status === "in_progress").length,
        converted: leads.filter((l) => l.status === "converted").length,
        lost: leads.filter((l) => l.status === "lost").length,
      };
      const funnelTotal = Object.values(counts).reduce((a, b) => a + b, 0);
      const funnelData: FunnelRow[] = [
        { name: "Nouveau", status: "new", value: counts.new },
        { name: "En cours", status: "in_progress", value: counts.in_progress },
        { name: "Converti", status: "converted", value: counts.converted },
        { name: "Perdu", status: "lost", value: counts.lost },
      ];

      const profEntries: Array<[string, string]> = ((profiles || []) as ProfileRow[]).map((p) => [
        p.id,
        p.full_name || p.id,
      ]);
      const profMap = new Map<string, string>(profEntries);
      const byUser = new Map<string, Omit<LeaderboardRow, "winRate">>();

      for (const l of leads) {
        const u = l.assigned_to || "unassigned";
        if (!byUser.has(u)) {
          byUser.set(u, {
            userId: u,
            name: profMap.get(u) || "Non assigne",
            assigned: 0,
            converted: 0,
            pipeline: 0,
          });
        }
        const row = byUser.get(u);
        if (!row) continue;
        row.assigned += 1;
        if (l.status === "converted") row.converted += 1;
        if (l.status !== "lost") row.pipeline += l.estimated_value || 0;
      }

      const leaderboard: LeaderboardRow[] = Array.from(byUser.values())
        .map((r) => ({
          ...r,
          winRate: r.assigned ? (r.converted / r.assigned) * 100 : 0,
        }))
        .sort((a, b) => b.pipeline - a.pipeline)
        .slice(0, 8);

      const sourceMap = new Map<string, number>();
      for (const l of leads) {
        const s = (l.source || "inconnu").toLowerCase();
        sourceMap.set(s, (sourceMap.get(s) || 0) + 1);
      }
      const leadsBySource: SourceRow[] = Array.from(sourceMap.entries()).map(([source, count]) => ({ source, count }));

      const activity: ActivityRow[] = [
        ...leads.slice(0, 8).map((l) => ({ type: "lead" as const, title: l.title, date: l.created_at })),
        ...tasks.slice(0, 8).map((t) => ({ type: "task" as const, title: t.title, date: t.created_at })),
      ]
        .sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime())
        .slice(0, 10);

      if (!mountedRef.current) return;

      setData({
        kpis: {
          pipelineTotal,
          pipelineVariation,
          conversionRate,
          conversionVariation,
          totalCompanies: companies.length,
          overdueTasks,
          monthRevenue,
          monthRevenueVariation,
          objectiveReachedPct,
          newLeadsThisMonth,
          meetingsToday,
          urgentTasks,
        },
        companies,
        contacts: (contactsRaw || []) as ContactRow[],
        leads,
        tasks,
        funnel: { total: funnelTotal, data: funnelData },
        leaderboard,
        marketing: { leadsBySource, leadsByStatus: funnelData },
        finance: { forecast: currentMonthPipeline, paid: 0, unpaid: 0 },
        activity,
        uid,
      });
    } catch (err) {
      console.error("Dashboard error", err);
    }
  }, []);

  const refreshDashboard = useCallback(async () => {
    if (loadingRef.current) return;

    loadingRef.current = true;
    if (mountedRef.current) setLoading(true);

    try {
      await loadDashboardData();
    } finally {
      loadingRef.current = false;
      if (mountedRef.current) setLoading(false);
    }
  }, [loadDashboardData]);

  useEffect(() => {
    mountedRef.current = true;
    void refreshDashboard();

    return () => {
      mountedRef.current = false;
    };
  }, [refreshDashboard]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const onEntityDeleted = () => {
      void refreshDashboard();
    };

    window.addEventListener(CRM_ENTITY_DELETED_EVENT, onEntityDeleted);
    return () => {
      window.removeEventListener(CRM_ENTITY_DELETED_EVENT, onEntityDeleted);
    };
  }, [refreshDashboard]);

  return { data, loading, refreshDashboard, formatCurrency, formatVariation };
}
