"use client";
export const dynamic = "force-dynamic";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import Card from "@/components/ui/Card";
import { TrendingUp } from "lucide-react";

type Lead = {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  company_id?: string | null;
  assigned_to?: string | null;
  status?: string | null;
};

type Profile = {
  id: string;
  full_name?: string | null;
  email?: string | null;
};

type Company = {
  id: string;
  name?: string | null;
};

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return String(error);
}

const STATUSES = ["new", "qualified", "proposal", "won", "lost"];

function formatStatusLabel(status: string) {
  if (status === "new") return "Nouveau";
  if (status === "qualified") return "Qualifié";
  if (status === "proposal") return "Proposition";
  if (status === "won") return "Gagné";
  if (status === "lost") return "Perdu";
  return status;
}

function statusBadgeClass(status: string) {
  if (status === "won") return "bg-[#2dd4bf]/25 text-[#115e59]";
  if (status === "proposal") return "bg-[#f97316]/15 text-[#c2410c]";
  if (status === "qualified") return "bg-[#99f6e4]/40 text-[#0d3d36]";
  return "bg-gray-100 text-gray-700";
}

export default function PipelinePage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profilesMap, setProfilesMap] = useState<Record<string, string>>({});
  const [companiesMap, setCompaniesMap] = useState<Record<string, string>>({});

  useEffect(() => {
    loadLeads();
  }, []);

  async function loadLeads() {
    setLoading(true);
    setError(null);
    try {
      const { data: userData, error: userErr } = await supabase.auth.getUser();
      if (userErr || !userData?.user) {
        setError("Vous devez être connecté pour voir le pipeline.");
        setLeads([]);
        setLoading(false);
        return;
      }
      const uid = userData.user.id;

      const { data: leadData, error: leadErr } = await supabase
        .from("leads")
        .select("id,first_name,last_name,email,company_id,assigned_to,status")
        .or(`owner_id.eq.${uid},assigned_to.eq.${uid}`)
        .order("due_date", { ascending: true });

      if (leadErr) throw leadErr;

      const items = (leadData || []) as Lead[];
      setLeads(items);

      // Fetch profiles and companies used by leads
      const profileIds = Array.from(new Set(items.map((l) => l.assigned_to).filter(Boolean))) as string[];
      if (profileIds.length > 0) {
        const { data: profiles } = await supabase.from("profiles").select("id,full_name,email").in("id", profileIds);
        const map: Record<string, string> = {};
        (profiles as Profile[] | null || []).forEach((p) => (map[p.id] = p.full_name || p.email || p.id));
        setProfilesMap(map);
      } else {
        setProfilesMap({});
      }

      const companyIds = Array.from(new Set(items.map((l) => l.company_id).filter(Boolean))) as string[];
      if (companyIds.length > 0) {
        const { data: companies } = await supabase.from("companies").select("id,name").in("id", companyIds);
        const cmap: Record<string, string> = {};
        (companies as Company[] | null || []).forEach((c) => (cmap[c.id] = c.name || c.id));
        setCompaniesMap(cmap);
      } else {
        setCompaniesMap({});
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  const grouped = useMemo(() => {
    const g: Record<string, Lead[]> = {};
    STATUSES.forEach((s) => (g[s] = []));
    leads.forEach((l) => {
      const s = l.status || "new";
      if (!g[s]) g[s] = [];
      g[s].push(l);
    });
    return g;
  }, [leads]);

  async function changeStatus(id: string, newStatus: string) {
    const prev = leads;
    setLeads((cur) => cur.map((l) => (l.id === id ? { ...l, status: newStatus } : l)));
    try {
      const { error: upErr } = await supabase.from("leads").update({ status: newStatus }).eq("id", id);
      if (upErr) throw upErr;

      // If moved to won, trigger server-side email send
      if (newStatus === "won") {
        try {
          await fetch("/api/send-email", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              leadId: id,
              eventType: "lead_won",
              campaignName: "pipeline_won_automation",
              source: "automation",
            }),
          });
        } catch {
          setError("Impossible de déclencher l'e-mail post-vente.");
        }
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err));
      setLeads(prev);
    }
  }

  if (loading) return <div className="p-6">Chargement du pipeline...</div>;

  return (
    <div className="space-y-4 px-6 py-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Pipeline</h1>
          <p className="text-xs text-gray-500">Visualisez les prospects par étape</p>
        </div>
        <Link href="/dashboard/leads/new" className="btn-primary inline-flex h-10 items-center text-sm">
          Nouveau prospect
        </Link>
      </div>

      {error && <div className="mb-4 p-3 rounded-md bg-red-50 text-red-700">{error}</div>}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {STATUSES.map((status) => (
          <Card key={status} className="min-h-[220px]">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-900 capitalize">{formatStatusLabel(status)}</h3>
              <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusBadgeClass(status)}`}>{grouped[status]?.length || 0}</span>
            </div>

            <div className="flex-1 space-y-3">
              {(grouped[status] || []).length === 0 ? (
                <div className="py-4 flex flex-col items-center text-center">
                  <TrendingUp className="h-6 w-6 text-gray-400" />
                  <h4 className="mt-2 text-sm font-semibold text-gray-900">Aucun prospect</h4>
                  <p className="mt-1 text-xs text-gray-500">Aucun prospect dans ce statut.</p>
                </div>
              ) : (
                (grouped[status] || []).map((l) => (
                  <div key={l.id} className="bg-white rounded-2xl p-3 border border-gray-100 shadow-sm">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-sm font-semibold text-gray-900">{(l.first_name || "") + (l.last_name ? " " + l.last_name : "") || l.email || "Sans nom"}</div>
                        <div className="text-xs text-gray-500">{l.email || "—"}</div>
                        <div className="text-xs text-gray-500">{l.company_id ? companiesMap[l.company_id] || l.company_id : "—"}</div>
                        <div className="text-xs text-gray-500">{l.assigned_to ? profilesMap[l.assigned_to] || l.assigned_to : "Non assigné"}</div>
                      </div>
                      <div className="ml-2">
                        <select
                          value={l.status || "new"}
                          onChange={(e) => changeStatus(l.id, e.target.value)}
                          className="input-modern text-sm min-w-[120px]"
                        >
                          {STATUSES.map((s) => (
                            <option key={s} value={s}>
                              {formatStatusLabel(s)}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
