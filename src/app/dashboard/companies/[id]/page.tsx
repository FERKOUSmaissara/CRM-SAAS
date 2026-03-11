"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Card from "@/components/ui/Card";

type CompanyDetails = {
  id: string;
  name: string | null;
  industry: string | null;
  created_at?: string | null;
};

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return String(error);
}

export default function CompanyDetailsPage() {
  const params = useParams();
  const id = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [company, setCompany] = useState<CompanyDetails | null>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error: companyErr } = await supabase
          .from("companies")
          .select("id,name,industry,created_at")
          .eq("id", id)
          .single();

        if (companyErr) throw companyErr;
        setCompany((data as CompanyDetails) || null);
      } catch (err: unknown) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) return <div className="px-6 py-6">Chargement de l’entreprise...</div>;

  return (
    <div className="px-6 py-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Détails de l’entreprise</h1>
          <p className="text-xs text-gray-500">Vue détaillée de la fiche CRM</p>
        </div>
        <Link href="/dashboard/companies" className="h-10 inline-flex items-center px-4 rounded-2xl border border-gray-200 text-sm text-gray-700 hover:bg-gray-50">
          Retour aux entreprises
        </Link>
      </div>

      {error ? <div className="text-sm text-red-600">{error}</div> : null}

      <Card className="max-w-3xl" title={company?.name || "Entreprise"} subtitle={company?.industry || "—"}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-900">Secteur</label>
            <div className="input-modern mt-1 text-sm bg-gray-50">{company?.industry || "—"}</div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-900">Créée le</label>
            <div className="input-modern mt-1 text-sm bg-gray-50">{company?.created_at ? new Date(company.created_at).toLocaleString() : "—"}</div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-900">ID entreprise</label>
            <div className="input-modern mt-1 text-sm bg-gray-50">{company?.id || "—"}</div>
          </div>
        </div>
      </Card>
    </div>
  );
}
