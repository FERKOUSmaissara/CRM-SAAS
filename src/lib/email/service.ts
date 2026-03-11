import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Service d'emailing CRM — intégration Brevo.
 *
 * Ce module gère l'ensemble du cycle d'envoi d'un email CRM :
 *  1. Résolution des destinataires : charge les prospects depuis Supabase,
 *     résout l'adresse email (email direct sur le prospect, ou via le contact lié).
 *  2. Composition du message : génère un sujet/corps par défaut selon le type
 *     d'événement (campagne, lead gagné, relance manuelle…).
 *  3. Envoi via l'API Brevo : POST sur /v3/smtp/email avec un header
 *     X-Mailin-custom permettant de tracer chaque envoi dans email_logs.
 *  4. Persistance des logs : chaque envoi crée une ligne dans `email_logs`
 *     (statut, message ID Brevo, erreur éventuelle).
 *  5. Traitement des webhooks : parse les événements Brevo entrants
 *     (delivered, opened, clicked, bounced…) et met à jour email_logs.
 */

type JsonObject = Record<string, unknown>;

type LeadQueryRow = {
  id: string;
  title?: string | null;
  email?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  owner_id?: string | null;
  contact_id?: string | null;
};

type ContactQueryRow = {
  id: string;
  email?: string | null;
  first_name?: string | null;
  last_name?: string | null;
};

export type LeadRecipient = {
  id: string;
  title: string | null;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  ownerId: string | null;
  contactId: string | null;
};

export type SendLeadEmailInput = {
  supabase: SupabaseClient;
  brevoApiKey: string;
  fromEmail: string;
  lead: LeadRecipient;
  eventType?: string;
  campaignName?: string;
  subject?: string;
  htmlContent?: string;
  textContent?: string;
  source?: string;
};

export type SendLeadEmailResult = {
  ok: boolean;
  leadId: string;
  toEmail: string | null;
  logId: string;
  providerMessageId: string | null;
  error?: string;
};

export type BrevoWebhookEvent = Record<string, unknown>;

const BREVO_ENDPOINT = "https://api.brevo.com/v3/smtp/email";
const BREVO_SENDER_NAME = "FerkousFlow CRM";

const OPTIONAL_EMAIL_LOG_FIELDS = [
  "provider_message_id",
  "provider_event",
  "event_type",
  "campaign_name",
  "source",
  "opened_count",
  "clicked_count",
  "delivered_at",
  "first_opened_at",
  "first_clicked_at",
  "last_event_at",
  "metadata",
] as const;

const OPEN_EVENT_NAMES = new Set(["opened", "open", "unique_opened", "unique_open"]);
const CLICK_EVENT_NAMES = new Set(["clicked", "click", "unique_clicked", "unique_click"]);
const ERROR_EVENT_NAMES = new Set([
  "error",
  "hard_bounce",
  "soft_bounce",
  "blocked",
  "invalid_email",
  "spam",
  "unsubscribed",
  "dropped",
  "deferred",
]);

function asString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function toErrorMessage(value: unknown): string {
  if (value instanceof Error) return value.message;
  return String(value);
}

function stripUndefined<T extends JsonObject>(value: T): T {
  const entries = Object.entries(value).filter(([, fieldValue]) => fieldValue !== undefined);
  return Object.fromEntries(entries) as T;
}

function removeUnknownFieldFromPayload(payload: JsonObject, errorMessage: string): JsonObject | null {
  for (const field of OPTIONAL_EMAIL_LOG_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(payload, field) && errorMessage.includes(field)) {
      const reduced = { ...payload };
      delete reduced[field];
      return reduced;
    }
  }

  return null;
}

export async function insertEmailLogWithFallback(supabase: SupabaseClient, row: JsonObject): Promise<void> {
  let payload: JsonObject = { ...row };

  while (true) {
    const { error } = await supabase.from("email_logs").insert([payload]);
    if (!error) return;

    const reducedPayload = removeUnknownFieldFromPayload(payload, error.message);
    if (!reducedPayload) {
      throw error;
    }

    payload = reducedPayload;
  }
}

export async function updateEmailLogWithFallback(
  supabase: SupabaseClient,
  logId: string,
  patch: JsonObject
): Promise<void> {
  let payload: JsonObject = { ...patch };

  while (true) {
    const { error } = await supabase.from("email_logs").update(payload).eq("id", logId);
    if (!error) return;

    const reducedPayload = removeUnknownFieldFromPayload(payload, error.message);
    if (!reducedPayload) {
      throw error;
    }

    payload = reducedPayload;
  }
}

function sanitizeTag(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "_")
    .slice(0, 40);
}

function defaultEmailCopy(lead: LeadRecipient, eventType: string, campaignName: string) {
  const fullName = [lead.firstName, lead.lastName].filter(Boolean).join(" ").trim();
  const displayName = fullName || lead.title || "there";

  if (eventType === "lead_won") {
    return {
      subject: `Good news: your deal is now won`,
      htmlContent: `<p>Hello ${displayName},</p><p>Your opportunity has been marked as <strong>won</strong>. Thank you for your trust.</p>`,
      textContent: `Hello ${displayName}, your opportunity has been marked as won. Thank you for your trust.`,
    };
  }

  if (eventType === "campaign") {
    return {
      subject: `${campaignName}`,
      htmlContent: `<p>Hello ${displayName},</p><p>We are reaching out with a new update from our CRM campaign: <strong>${campaignName}</strong>.</p>`,
      textContent: `Hello ${displayName}, we are reaching out with a new update from our CRM campaign: ${campaignName}.`,
    };
  }

  return {
    subject: `A new update from your CRM`,
    htmlContent: `<p>Hello ${displayName},</p><p>We have an update regarding your record in our CRM. We will follow up shortly.</p>`,
    textContent: `Hello ${displayName}, we have an update regarding your CRM record. We will follow up shortly.`,
  };
}

export function normalizeBrevoMessageId(rawValue: unknown): string | null {
  const rawString = asString(rawValue);
  if (!rawString) return null;

  return rawString.replace(/^<+|>+$/g, "").trim();
}

export function buildMailinCustom(logId: string, leadId: string, eventType: string, campaignName: string): string {
  return `crm_log_id:${logId}|lead_id:${leadId}|event_type:${eventType}|campaign_name:${campaignName}`;
}

export function parseMailinCustom(rawValue: string | null | undefined): Record<string, string> {
  if (!rawValue) return {};

  const parsed: Record<string, string> = {};

  for (const entry of rawValue.split("|")) {
    const chunk = entry.trim();
    if (!chunk) continue;

    const separatorIndex = chunk.includes(":") ? chunk.indexOf(":") : chunk.indexOf("=");
    if (separatorIndex <= 0) continue;

    const key = chunk.slice(0, separatorIndex).trim();
    const value = chunk.slice(separatorIndex + 1).trim();
    if (!key || !value) continue;

    parsed[key] = value;
  }

  return parsed;
}

export function extractBrevoCustomPayload(event: BrevoWebhookEvent): string | null {
  const directFields = [
    asString(event["X-Mailin-custom"]),
    asString(event["X-Mailin-Custom"]),
    asString(event["x-mailin-custom"]),
    asString(event["mailin_custom"]),
  ];

  for (const candidate of directFields) {
    if (candidate) return candidate;
  }

  const headers = event.headers;
  if (headers && typeof headers === "object") {
    const headerRecord = headers as Record<string, unknown>;
    return (
      asString(headerRecord["X-Mailin-custom"]) ||
      asString(headerRecord["x-mailin-custom"]) ||
      asString(headerRecord["X-Mailin-Custom"])
    );
  }

  return null;
}

export function readBrevoMessageId(event: BrevoWebhookEvent): string | null {
  return (
    normalizeBrevoMessageId(event["message-id"]) ||
    normalizeBrevoMessageId(event.messageId) ||
    normalizeBrevoMessageId(event.message_id) ||
    normalizeBrevoMessageId(event["smtp-id"]) ||
    normalizeBrevoMessageId(event["smtp_id"])
  );
}

export function readBrevoEventType(event: BrevoWebhookEvent): string {
  const rawEventType = asString(event.event);
  return (rawEventType || "unknown").toLowerCase();
}

export function readBrevoEventTimestamp(event: BrevoWebhookEvent): string {
  const fromDateString = asString(event.date);
  if (fromDateString) {
    const parsedDate = new Date(fromDateString);
    if (!Number.isNaN(parsedDate.getTime())) {
      return parsedDate.toISOString();
    }
  }

  const tsEvent = typeof event.ts_event === "number" ? event.ts_event : null;
  if (tsEvent) return new Date(tsEvent * 1000).toISOString();

  const ts = typeof event.ts === "number" ? event.ts : null;
  if (ts) return new Date(ts * 1000).toISOString();

  return new Date().toISOString();
}

export function isOpenEventType(eventType: string): boolean {
  return OPEN_EVENT_NAMES.has(eventType);
}

export function isClickEventType(eventType: string): boolean {
  return CLICK_EVENT_NAMES.has(eventType);
}

export function isErrorEventType(eventType: string): boolean {
  return ERROR_EVENT_NAMES.has(eventType);
}

export function mapBrevoEventToStatus(eventType: string): "sent" | "error" {
  return isErrorEventType(eventType) ? "error" : "sent";
}

export async function loadLeadRecipients(supabase: SupabaseClient, leadIds: string[]): Promise<LeadRecipient[]> {
  const uniqueLeadIds = Array.from(new Set(leadIds.map((id) => id.trim()).filter(Boolean)));
  if (uniqueLeadIds.length === 0) return [];

  const leadPrimary = await supabase
    .from("leads")
    .select("id,title,email,owner_id,contact_id")
    .in("id", uniqueLeadIds);

  let leadRows: LeadQueryRow[] = [];

  if (leadPrimary.error) {
    const leadFallback = await supabase.from("leads").select("id,title,email,owner_id,contact_id").in("id", uniqueLeadIds);
    if (leadFallback.error) throw leadFallback.error;

    leadRows = ((leadFallback.data || []) as LeadQueryRow[]).filter((row) => Boolean(row.id));
  } else {
    leadRows = ((leadPrimary.data || []) as LeadQueryRow[]).filter((row) => Boolean(row.id));
  }

  const contactIdsToResolve = Array.from(
    new Set(
      leadRows
        .filter((lead) => !asString(lead.email) && asString(lead.contact_id))
        .map((lead) => asString(lead.contact_id) as string)
    )
  );

  const contactsById = new Map<string, ContactQueryRow>();

  if (contactIdsToResolve.length > 0) {
    const contactPrimary = await supabase
      .from("contacts")
      .select("id,email,first_name,last_name")
      .in("id", contactIdsToResolve);

    let contactRows: ContactQueryRow[] = [];

    if (contactPrimary.error) {
      const contactFallback = await supabase.from("contacts").select("id,email").in("id", contactIdsToResolve);
      if (!contactFallback.error) {
        contactRows = (contactFallback.data || []) as ContactQueryRow[];
      }
    } else {
      contactRows = (contactPrimary.data || []) as ContactQueryRow[];
    }

    for (const contact of contactRows) {
      if (!contact.id) continue;
      contactsById.set(contact.id, contact);
    }
  }

  return leadRows.map((lead) => {
    const contact = lead.contact_id ? contactsById.get(lead.contact_id) : undefined;

    const email = asString(lead.email) || asString(contact?.email) || null;
    const firstName = asString(lead.first_name) || asString(contact?.first_name) || null;
    const lastName = asString(lead.last_name) || asString(contact?.last_name) || null;

    return {
      id: lead.id,
      title: lead.title || null,
      email,
      firstName,
      lastName,
      ownerId: lead.owner_id || null,
      contactId: lead.contact_id || null,
    };
  });
}

export async function sendLeadEmail(input: SendLeadEmailInput): Promise<SendLeadEmailResult> {
  const {
    supabase,
    brevoApiKey,
    fromEmail,
    lead,
    eventType = "manual_followup",
    campaignName = "general_campaign",
    subject,
    htmlContent,
    textContent,
    source = "manual",
  } = input;

  const resolvedEventType = eventType.trim().toLowerCase() || "manual_followup";
  const resolvedCampaignName = campaignName.trim() || "general_campaign";

  const defaultCopy = defaultEmailCopy(lead, resolvedEventType, resolvedCampaignName);

  const resolvedSubject = (subject?.trim() || defaultCopy.subject).slice(0, 255);
  const resolvedHtmlContent = htmlContent?.trim() || defaultCopy.htmlContent;
  const resolvedTextContent = textContent?.trim() || defaultCopy.textContent;

  const toEmail = asString(lead.email);
  const logId = crypto.randomUUID();
  const nowIso = new Date().toISOString();

  await insertEmailLogWithFallback(
    supabase,
    stripUndefined({
      id: logId,
      lead_id: lead.id,
      to_email: toEmail,
      subject: resolvedSubject,
      body: resolvedHtmlContent,
      status: "queued",
      event_type: resolvedEventType,
      campaign_name: resolvedCampaignName,
      source,
      opened_count: 0,
      clicked_count: 0,
      metadata: {
        event_type: resolvedEventType,
        campaign_name: resolvedCampaignName,
      },
      sent_at: null,
    })
  );

  if (!toEmail) {
    const missingEmailError = "Lead has no email address";

    await updateEmailLogWithFallback(
      supabase,
      logId,
      stripUndefined({
        status: "error",
        error: missingEmailError,
        sent_at: nowIso,
      })
    );

    return {
      ok: false,
      leadId: lead.id,
      toEmail: null,
      logId,
      providerMessageId: null,
      error: missingEmailError,
    };
  }

  const fullName = [lead.firstName, lead.lastName].filter(Boolean).join(" ").trim();
  const recipientName = fullName || lead.title || undefined;

  const customHeader = buildMailinCustom(logId, lead.id, resolvedEventType, resolvedCampaignName);

  let brevoResponse: Response;
  let brevoBody: JsonObject = {};

  try {
    brevoResponse = await fetch(BREVO_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": brevoApiKey,
      },
      body: JSON.stringify({
        sender: {
          name: BREVO_SENDER_NAME,
          email: fromEmail,
        },
        to: [{ email: toEmail, name: recipientName }],
        subject: resolvedSubject,
        htmlContent: resolvedHtmlContent,
        textContent: resolvedTextContent,
        tags: [sanitizeTag(resolvedCampaignName), sanitizeTag(resolvedEventType), sanitizeTag(source)].filter(Boolean),
        headers: {
          "X-Mailin-custom": customHeader,
        },
      }),
    });

    brevoBody = (await brevoResponse.json().catch(() => ({}))) as JsonObject;
  } catch (error: unknown) {
    const requestError = toErrorMessage(error);

    await updateEmailLogWithFallback(
      supabase,
      logId,
      stripUndefined({
        status: "error",
        error: requestError.slice(0, 4000),
        sent_at: new Date().toISOString(),
      })
    );

    return {
      ok: false,
      leadId: lead.id,
      toEmail,
      logId,
      providerMessageId: null,
      error: requestError,
    };
  }

  const providerMessageId =
    normalizeBrevoMessageId(brevoBody.messageId) ||
    normalizeBrevoMessageId(brevoBody["message-id"]) ||
    normalizeBrevoMessageId(brevoBody.message_id);

  if (!brevoResponse.ok) {
    const responseError =
      Object.keys(brevoBody).length > 0
        ? JSON.stringify(brevoBody).slice(0, 4000)
        : `Brevo request failed with status ${brevoResponse.status}`;

    await updateEmailLogWithFallback(
      supabase,
      logId,
      stripUndefined({
        status: "error",
        error: responseError,
        sent_at: new Date().toISOString(),
        provider_message_id: providerMessageId,
      })
    );

    return {
      ok: false,
      leadId: lead.id,
      toEmail,
      logId,
      providerMessageId,
      error: responseError,
    };
  }

  await updateEmailLogWithFallback(
    supabase,
    logId,
    stripUndefined({
      status: "sent",
      error: null,
      sent_at: new Date().toISOString(),
      provider_message_id: providerMessageId,
    })
  );

  return {
    ok: true,
    leadId: lead.id,
    toEmail,
    logId,
    providerMessageId,
  };
}
