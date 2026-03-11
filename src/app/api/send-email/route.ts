import { NextResponse } from "next/server";
import { loadLeadRecipients, sendLeadEmail } from "@/lib/email/service";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";

/**
 * Route API : envoi d'email individuel ou de campagne via Brevo.
 *
 * POST /api/send-email
 *
 * Modes d'utilisation :
 *  - Email individuel  : { leadId: string }
 *  - Campagne multiple : { leadIds: string[], campaignName: string, eventType: string }
 *
 * Codes de réponse :
 *  - 200 : tous les emails envoyés avec succès
 *  - 207 : succès partiel (certains ont échoué)
 *  - 400 : paramètres manquants ou invalides
 *  - 404 : aucun prospect trouvé pour les IDs fournis
 *  - 500 : erreur serveur (clé Brevo manquante, exception inattendue)
 *  - 502 : tous les envois ont échoué
 *
 * Chaque envoi crée un enregistrement dans la table `email_logs` de Supabase
 * pour permettre le suivi des événements Brevo (ouverture, clic, etc.).
 */

export const runtime = "nodejs";

type Body = {
  leadId?: string;
  leadIds?: string[];
  eventType?: string;
  campaignName?: string;
  subject?: string;
  htmlContent?: string;
  textContent?: string;
  source?: string;
};

function isMeaningfulErrorText(value: string): boolean {
  const normalized = value.trim();
  if (!normalized) return false;

  const blocked = new Set(["{}", "[object Object]", "null", "undefined"]);
  return !blocked.has(normalized);
}

function toApiErrorMessage(error: unknown, fallback = "Failed to send campaign"): string {
  if (error instanceof Error && error.message?.trim()) {
    return isMeaningfulErrorText(error.message) ? error.message : fallback;
  }

  if (typeof error === "string" && isMeaningfulErrorText(error)) {
    return error;
  }

  if (error && typeof error === "object") {
    const maybeError = error as {
      message?: unknown;
      error?: unknown;
      details?: unknown;
    };

    const candidates = [maybeError.message, maybeError.error, maybeError.details];
    for (const candidate of candidates) {
      if (typeof candidate === "string" && isMeaningfulErrorText(candidate)) {
        return candidate;
      }
    }

    try {
      const serialized = JSON.stringify(error);
      if (serialized && isMeaningfulErrorText(serialized)) {
        return serialized;
      }
    } catch {
      // Ignore stringify failures and use fallback.
    }
  }

  return fallback;
}

function getLeadIdsFromBody(body: Body): string[] {
  const singleLeadId = body.leadId?.trim();
  const multipleLeadIds = Array.isArray(body.leadIds) ? body.leadIds.map((id) => id.trim()) : [];

  const all = [...multipleLeadIds, ...(singleLeadId ? [singleLeadId] : [])].filter(Boolean);
  return Array.from(new Set(all));
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;
    const leadIds = getLeadIdsFromBody(body);

    if (leadIds.length === 0) {
      return NextResponse.json({ error: "leadId or leadIds is required" }, { status: 400 });
    }

    const brevoApiKey = process.env.BREVO_API_KEY;
    const brevoFromEmail = process.env.BREVO_FROM_EMAIL || "no-reply@example.com";

    if (!brevoApiKey) {
      return NextResponse.json({ error: "BREVO_API_KEY not configured" }, { status: 500 });
    }

    const supabase = createSupabaseAdminClient();
    const leads = await loadLeadRecipients(supabase, leadIds);

    if (leads.length === 0) {
      return NextResponse.json({ error: "No leads found for the provided ids" }, { status: 404 });
    }

    const leadsById = new Map(leads.map((lead) => [lead.id, lead]));
    const orderedLeadIds = leadIds.filter((id) => leadsById.has(id));

    const results = [];

    for (const leadId of orderedLeadIds) {
      const lead = leadsById.get(leadId);
      if (!lead) continue;

      const result = await sendLeadEmail({
        supabase,
        brevoApiKey,
        fromEmail: brevoFromEmail,
        lead,
        eventType: body.eventType || "manual_followup",
        campaignName: body.campaignName || "crm_default_campaign",
        subject: body.subject,
        htmlContent: body.htmlContent,
        textContent: body.textContent,
        source: body.source || (leadIds.length > 1 ? "campaign" : "manual"),
      });

      results.push(result);
    }

    const successCount = results.filter((row) => row.ok).length;
    const failureCount = results.length - successCount;
    const isCampaign = leadIds.length > 1;

    const statusCode = failureCount === 0 ? 200 : successCount > 0 ? 207 : 502;
    const firstResultError = results.find((row) => !row.ok)?.error;
    const failureFallback = statusCode >= 400 ? "Failed to send campaign" : "Campaign completed with partial failures";
    const normalizedFailureError = toApiErrorMessage(firstResultError, failureFallback);

    const responseBody = {
      ok: failureCount === 0,
      isCampaign,
      eventType: body.eventType || "manual_followup",
      campaignName: body.campaignName || "crm_default_campaign",
      successCount,
      failureCount,
      results,
      ...(failureCount > 0
        ? {
            error: normalizedFailureError,
          }
        : {}),
    };

    return NextResponse.json(responseBody, { status: statusCode });
  } catch (error: unknown) {
    console.error("Campaign send error:", error);
    const message = toApiErrorMessage(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
