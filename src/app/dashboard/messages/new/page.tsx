"use client";
export const dynamic = "force-dynamic";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Card from "@/components/ui/Card";
import { supabase } from "@/lib/supabase";

type LeadOption = {
  id: string;
  title?: string | null;
  status?: string | null;
  created_at?: string | null;
  email?: string | null;
};

const SEGMENTS = ["all", "new", "qualified", "proposal", "won", "in_progress", "converted", "lost"];

const SEGMENT_LABELS: Record<string, string> = {
  all: "Tous les prospects",
  new: "Nouveau",
  qualified: "Qualifié",
  proposal: "Proposition",
  won: "Gagné",
  in_progress: "En cours",
  converted: "Converti",
  lost: "Perdu",
};

function normalizeStatus(status: string | null | undefined): string {
  return (status || "").trim().toLowerCase();
}

function getReadableErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (typeof error === "string" && error.trim()) {
    return error;
  }

  if (error && typeof error === "object") {
    const maybeError = error as { message?: unknown; error?: unknown; details?: unknown };
    const candidates = [maybeError.message, maybeError.error, maybeError.details];

    for (const candidate of candidates) {
      if (typeof candidate === "string" && candidate.trim()) {
        return candidate;
      }
    }

    try {
      const serialized = JSON.stringify(error);
      if (serialized && serialized !== "{}") {
        return serialized;
      }
    } catch {
      // Ignore JSON stringify errors and fall through to default message.
    }
  }

  return "Une erreur est survenue.";
}

function formatCampaignApiError(payload: unknown): string {
  let message = "Échec de l'envoi de la campagne.";

  if (typeof payload === "string" && payload.trim()) {
    return payload;
  }

  if (payload && typeof payload === "object") {
    const typedPayload = payload as {
      message?: unknown;
      error?: unknown;
    };

    if (typeof typedPayload.error === "object" && typedPayload.error !== null) {
      const nestedError = typedPayload.error as { message?: unknown };
      if (typeof nestedError.message === "string" && nestedError.message.trim()) {
        return nestedError.message;
      }
    }

    if (typeof typedPayload.message === "string" && typedPayload.message.trim()) {
      return typedPayload.message;
    }

    if (typeof typedPayload.error === "string" && typedPayload.error.trim()) {
      return typedPayload.error;
    }

    if (typedPayload.error !== undefined) {
      try {
        const serializedError = JSON.stringify(typedPayload.error);
        if (typeof serializedError === "string" && serializedError.trim()) {
          return serializedError;
        }
      } catch {
        // Ignore stringify failures and fall back below.
      }
    }

    try {
      const serializedPayload = JSON.stringify(typedPayload);
      if (typeof serializedPayload === "string" && serializedPayload.trim() && serializedPayload !== "{}") {
        return serializedPayload;
      }
    } catch {
      // Ignore stringify failures and use default message.
    }
  }

  return message;
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function toHtmlContent(message: string): string {
  const chunks = message
    .split(/\n+/)
    .map((chunk) => chunk.trim())
    .filter(Boolean);

  if (chunks.length === 0) {
    return "<p>Aucun contenu fourni.</p>";
  }

  return chunks.map((chunk) => `<p>${escapeHtml(chunk)}</p>`).join("");
}

export default function NewMessagePage() {
  const [leads, setLeads] = useState<LeadOption[]>([]);
  const [loadingLeads, setLoadingLeads] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultMessage, setResultMessage] = useState<string | null>(null);

  const [campaignName, setCampaignName] = useState("crm_monthly_campaign");
  const [segment, setSegment] = useState("all");
  const [subject, setSubject] = useState("Mise à jour de votre CRM");
  const [message, setMessage] = useState("Bonjour,\n\nVoici notre dernière mise à jour concernant votre fiche CRM.");

  useEffect(() => {
    void loadLeads();
  }, []);

  async function loadLeads() {
    setLoadingLeads(true);
    setError(null);

    try {
      const { data, error: leadsError } = await supabase
        .from("leads")
        .select("id,title,status,created_at,email")
        .order("created_at", { ascending: false })
        .limit(500);

      if (leadsError) throw leadsError;
      setLeads((data as LeadOption[]) || []);
    } catch (loadError: unknown) {
      console.error(loadError);
      setError(getReadableErrorMessage(loadError));
    } finally {
      setLoadingLeads(false);
    }
  }

  const targetedLeads = useMemo(() => {
    if (segment === "all") return leads;
    return leads.filter((lead) => normalizeStatus(lead.status) === segment);
  }, [leads, segment]);

  async function sendCampaign() {
    setError(null);
    setResultMessage(null);

    if (!campaignName.trim()) {
      setError("Le nom de la campagne est requis.");
      return;
    }

    if (!subject.trim()) {
      setError("Le sujet est requis.");
      return;
    }

    if (!message.trim()) {
      setError("Le contenu du message est requis.");
      return;
    }

    if (targetedLeads.length === 0) {
      setError("Aucun prospect dans ce segment.");
      return;
    }

    setSending(true);

    try {
      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadIds: targetedLeads.map((lead) => lead.id),
          eventType: "campaign",
          campaignName,
          subject,
          htmlContent: toHtmlContent(message),
          textContent: message,
          source: "campaign",
        }),
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok && response.status !== 207) {
        console.error("Campaign API error:", payload);

        const message = formatCampaignApiError(payload);
        setError(message);
        return;
      }

      const successCount = Number(payload?.successCount || 0);
      const failureCount = Number(payload?.failureCount || 0);

      setResultMessage(
        `Campagne traitée. Succès: ${successCount} | Échecs: ${failureCount} | Prospects ciblés: ${targetedLeads.length}`
      );
    } catch (sendError: unknown) {
      console.error(sendError);
      setError(getReadableErrorMessage(sendError));
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="px-6 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Campagne e-mail</h1>
          <p className="text-sm text-gray-400">Créer une campagne CRM basée sur un segment avec Brevo</p>
        </div>
        <Link href="/dashboard/messages" className="h-10 inline-flex items-center px-4 rounded-2xl border border-gray-200 text-sm text-gray-700 hover:bg-gray-50">
          Retour
        </Link>
      </div>

      <Card className="max-w-3xl">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-900">Nom de la campagne</label>
            <input
              value={campaignName}
              onChange={(event) => setCampaignName(event.target.value)}
              className="input-modern mt-1 text-sm"
              placeholder="Ex. : q2_relance_prospects"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-900">Segment</label>
              <select value={segment} onChange={(event) => setSegment(event.target.value)} className="input-modern mt-1 text-sm">
                {SEGMENTS.map((segmentOption) => (
                  <option key={segmentOption} value={segmentOption}>
                    {SEGMENT_LABELS[segmentOption] || segmentOption.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900">Destinataires</label>
              <div className="input-modern mt-1 text-sm flex items-center">
                {loadingLeads ? "Chargement des prospects..." : `${targetedLeads.length} prospect(s) cible(s)`}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900">Sujet</label>
            <input
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              className="input-modern mt-1 text-sm"
              placeholder="Sujet de la campagne"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900">Message</label>
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              rows={8}
              className="input-modern mt-1 text-sm"
              placeholder="Rédigez le contenu de votre campagne..."
            />
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-3">
            <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Aperçu des destinataires</div>
            <div className="mt-2 text-sm text-gray-600">
              {targetedLeads.length === 0
                ? "Aucun prospect dans ce segment."
                : targetedLeads
                    .slice(0, 5)
                    .map((lead) => lead.title || lead.id)
                    .join(" | ")}
              {targetedLeads.length > 5 ? " | ..." : ""}
            </div>
          </div>

          {error ? <div className="text-sm text-red-600">{error}</div> : null}
          {resultMessage ? <div className="text-sm text-emerald-600">{resultMessage}</div> : null}

          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => void sendCampaign()}
              disabled={sending || loadingLeads}
              className="btn-primary h-10 inline-flex items-center text-sm disabled:opacity-60"
            >
              {sending ? "Envoi..." : "Envoyer la campagne"}
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}
