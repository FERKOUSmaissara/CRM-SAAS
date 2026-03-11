"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Card from "@/components/ui/Card";

type LeadDetails = {
  id: string;
  title: string | null;
  status: string | null;
  estimated_value: number | null;
  source: string | null;
  created_at: string | null;
};

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return String(error);
}

export default function LeadDetailsPage() {
  const params = useParams();
  const id = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lead, setLead] = useState<LeadDetails | null>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error: leadErr } = await supabase
          .from("leads")
          .select("id,title,status,estimated_value,source,created_at")
          .eq("id", id)
          .single();

        if (leadErr) throw leadErr;
        setLead((data as LeadDetails) || null);
      } catch (err: unknown) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) return <div className="px-6 py-6">Chargement du prospect...</div>;

  return (
    <div className="px-6 py-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Détails du prospect</h1>
          <p className="text-xs text-gray-500">Vue détaillée de la fiche CRM</p>
        </div>
        <Link href="/dashboard/leads" className="h-10 inline-flex items-center px-4 rounded-2xl border border-gray-200 text-sm text-gray-700 hover:bg-gray-50">
          Retour aux prospects
        </Link>
      </div>

      {error ? <div className="text-sm text-red-600">{error}</div> : null}

      <Card className="max-w-3xl" title={lead?.title || "Prospect"} subtitle={lead?.status || "—"}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-900">Valeur estimée</label>
            <div className="input-modern mt-1 text-sm bg-gray-50">{lead?.estimated_value ?? "—"}</div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-900">Source</label>
            <div className="input-modern mt-1 text-sm bg-gray-50">{lead?.source || "—"}</div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-900">Créé le</label>
            <div className="input-modern mt-1 text-sm bg-gray-50">{lead?.created_at ? new Date(lead.created_at).toLocaleString() : "—"}</div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-900">ID prospect</label>
            <div className="input-modern mt-1 text-sm bg-gray-50">{lead?.id || "—"}</div>
          </div>
        </div>
      </Card>
    </div>
  );
}
