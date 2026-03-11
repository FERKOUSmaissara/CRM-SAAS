"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Card from "@/components/ui/Card";

type ContactDetails = {
  id: string;
  name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  email: string | null;
  phone?: string | null;
  created_at?: string | null;
};

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return String(error);
}

export default function ContactDetailsPage() {
  const params = useParams();
  const id = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [contact, setContact] = useState<ContactDetails | null>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error: contactErr } = await supabase
          .from("contacts")
          .select("id,name,first_name,last_name,email,phone,created_at")
          .eq("id", id)
          .single();

        if (contactErr) throw contactErr;
        setContact((data as ContactDetails) || null);
      } catch (err: unknown) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const displayName =
    contact?.name ||
    `${contact?.first_name || ""} ${contact?.last_name || ""}`.trim() ||
    "Contact";

  if (loading) return <div className="px-6 py-6">Chargement du contact...</div>;

  return (
    <div className="px-6 py-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Détails du contact</h1>
          <p className="text-xs text-gray-500">Vue détaillée de la fiche CRM</p>
        </div>
        <Link href="/dashboard/contacts" className="h-10 inline-flex items-center px-4 rounded-2xl border border-gray-200 text-sm text-gray-700 hover:bg-gray-50">
          Retour aux contacts
        </Link>
      </div>

      {error ? <div className="text-sm text-red-600">{error}</div> : null}

      <Card className="max-w-3xl" title={displayName} subtitle={contact?.email || "—"}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-900">Email</label>
            <div className="input-modern mt-1 text-sm bg-gray-50">{contact?.email || "—"}</div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-900">Téléphone</label>
            <div className="input-modern mt-1 text-sm bg-gray-50">{contact?.phone || "—"}</div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-900">Créé le</label>
            <div className="input-modern mt-1 text-sm bg-gray-50">{contact?.created_at ? new Date(contact.created_at).toLocaleString() : "—"}</div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-900">ID contact</label>
            <div className="input-modern mt-1 text-sm bg-gray-50">{contact?.id || "—"}</div>
          </div>
        </div>
      </Card>
    </div>
  );
}
