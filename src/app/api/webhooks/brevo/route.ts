import { NextResponse } from "next/server";
import {
  extractBrevoCustomPayload,
  insertEmailLogWithFallback,
  isClickEventType,
  isOpenEventType,
  mapBrevoEventToStatus,
  parseMailinCustom,
  readBrevoEventTimestamp,
  readBrevoEventType,
  readBrevoMessageId,
  updateEmailLogWithFallback,
} from "@/lib/email/service";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

type EmailLogRow = Record<string, unknown>;

function asString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function asNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : 0;
  }
  return 0;
}

function isUuid(value: string | null | undefined): boolean {
  if (!value) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function isWebhookAuthorized(req: Request): boolean {
  const configuredSecret = process.env.BREVO_WEBHOOK_SECRET;
  if (!configuredSecret) return true;

  const candidates = [
    req.headers.get("x-mailin-signature"),
    req.headers.get("x-brevo-signature"),
    req.headers.get("x-webhook-token"),
    req.headers.get("x-brevo-token"),
    req.headers.get("authorization"),
  ];

  return candidates.some((rawHeader) => {
    if (!rawHeader) return false;
    const normalized = rawHeader.replace(/^Bearer\s+/i, "").trim();
    return normalized === configuredSecret;
  });
}

function parseWebhookEvents(payload: unknown): Record<string, unknown>[] {
  if (Array.isArray(payload)) {
    return payload.filter((entry) => typeof entry === "object" && entry !== null) as Record<string, unknown>[];
  }

  if (typeof payload === "object" && payload !== null) {
    return [payload as Record<string, unknown>];
  }

  return [];
}

async function findLogById(supabase: ReturnType<typeof createSupabaseAdminClient>, logId: string) {
  const { data, error } = await supabase.from("email_logs").select("*").eq("id", logId).maybeSingle();
  if (error) return null;
  return (data || null) as EmailLogRow | null;
}

async function findLogByProviderMessageId(supabase: ReturnType<typeof createSupabaseAdminClient>, providerMessageId: string) {
  const { data, error } = await supabase
    .from("email_logs")
    .select("*")
    .eq("provider_message_id", providerMessageId)
    .order("created_at", { ascending: false })
    .limit(1);

  if (error) {
    if (error.message.includes("provider_message_id")) return null;
    throw error;
  }

  return ((data || [])[0] || null) as EmailLogRow | null;
}

async function findLogByEmail(supabase: ReturnType<typeof createSupabaseAdminClient>, email: string) {
  const { data, error } = await supabase
    .from("email_logs")
    .select("*")
    .eq("to_email", email)
    .order("created_at", { ascending: false })
    .limit(1);

  if (error) return null;
  return ((data || [])[0] || null) as EmailLogRow | null;
}

export async function POST(req: Request) {
  try {
    if (!isWebhookAuthorized(req)) {
      return NextResponse.json({ error: "Unauthorized webhook call" }, { status: 401 });
    }

    const payload = await req.json().catch(() => null);
    const events = parseWebhookEvents(payload);

    if (events.length === 0) {
      return NextResponse.json({ error: "No webhook events received" }, { status: 400 });
    }

    const supabase = createSupabaseAdminClient();

    const summary = {
      processed: 0,
      matched: 0,
      created: 0,
      errors: 0,
    };

    const failures: string[] = [];

    for (const event of events) {
      summary.processed += 1;

      try {
        const eventType = readBrevoEventType(event);
        const eventTimestamp = readBrevoEventTimestamp(event);
        const providerMessageId = readBrevoMessageId(event);
        const customPayload = parseMailinCustom(extractBrevoCustomPayload(event));
        const email = asString(event.email);

        let existingLog: EmailLogRow | null = null;

        const logIdFromPayload = customPayload.crm_log_id || customPayload.log_id || null;
        const validLogId = isUuid(logIdFromPayload) ? logIdFromPayload : null;
        if (validLogId) {
          existingLog = await findLogById(supabase, validLogId);
        }

        if (!existingLog && providerMessageId) {
          existingLog = await findLogByProviderMessageId(supabase, providerMessageId);
        }

        if (!existingLog && email) {
          existingLog = await findLogByEmail(supabase, email);
        }

        const resolvedStatus = mapBrevoEventToStatus(eventType);

        if (!existingLog) {
          const generatedLogId = validLogId || crypto.randomUUID();

          await insertEmailLogWithFallback(supabase, {
            id: generatedLogId,
            to_email: email,
            subject: `Webhook event: ${eventType}`,
            status: resolvedStatus,
            error: resolvedStatus === "error" ? JSON.stringify(event).slice(0, 4000) : null,
            sent_at: eventTimestamp,
            provider_message_id: providerMessageId,
            provider_event: eventType,
            event_type: "webhook_event",
            campaign_name: customPayload.campaign_name || customPayload.campaign || null,
            source: "brevo_webhook",
            opened_count: isOpenEventType(eventType) ? 1 : 0,
            clicked_count: isClickEventType(eventType) ? 1 : 0,
            delivered_at: eventType === "delivered" ? eventTimestamp : undefined,
            first_opened_at: isOpenEventType(eventType) ? eventTimestamp : undefined,
            first_clicked_at: isClickEventType(eventType) ? eventTimestamp : undefined,
            last_event_at: eventTimestamp,
            metadata: event,
          });

          summary.created += 1;
          continue;
        }

        const existingLogId = asString(existingLog.id);
        if (!existingLogId) {
          throw new Error("Webhook matched an email log row without an id");
        }

        const updatedOpenedCount = isOpenEventType(eventType)
          ? asNumber(existingLog.opened_count) + 1
          : asNumber(existingLog.opened_count);

        const updatedClickedCount = isClickEventType(eventType)
          ? asNumber(existingLog.clicked_count) + 1
          : asNumber(existingLog.clicked_count);

        await updateEmailLogWithFallback(supabase, existingLogId, {
          status: resolvedStatus,
          provider_event: eventType,
          provider_message_id: providerMessageId,
          error: resolvedStatus === "error" ? JSON.stringify(event).slice(0, 4000) : null,
          delivered_at: eventType === "delivered" ? eventTimestamp : undefined,
          opened_count: updatedOpenedCount,
          clicked_count: updatedClickedCount,
          first_opened_at: isOpenEventType(eventType) && !existingLog.first_opened_at ? eventTimestamp : undefined,
          first_clicked_at: isClickEventType(eventType) && !existingLog.first_clicked_at ? eventTimestamp : undefined,
          last_event_at: eventTimestamp,
          metadata: event,
        });

        summary.matched += 1;
      } catch (eventError: unknown) {
        summary.errors += 1;
        const message = eventError instanceof Error ? eventError.message : String(eventError);
        failures.push(message);
      }
    }

    return NextResponse.json({
      ok: summary.errors === 0,
      summary,
      failures: failures.slice(0, 10),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
