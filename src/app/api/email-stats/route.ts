import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

type EmailLogRow = Record<string, unknown>;

type CampaignAccumulator = {
  campaignName: string;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  errors: number;
};

function asString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function asNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
}

function hasDateValue(value: unknown): boolean {
  const dateString = asString(value);
  if (!dateString) return false;
  const parsedDate = new Date(dateString);
  return !Number.isNaN(parsedDate.getTime());
}

function toRate(numerator: number, denominator: number): number {
  if (denominator <= 0) return 0;
  return Number(((numerator / denominator) * 100).toFixed(2));
}

function isOpenEvent(row: EmailLogRow): boolean {
  const eventName = asString(row.provider_event)?.toLowerCase() || "";
  return ["opened", "open", "unique_opened", "unique_open"].includes(eventName);
}

function isClickEvent(row: EmailLogRow): boolean {
  const eventName = asString(row.provider_event)?.toLowerCase() || "";
  return ["clicked", "click", "unique_clicked", "unique_click"].includes(eventName);
}

function resolveCampaignName(row: EmailLogRow): string {
  const explicit = asString(row.campaign_name);
  if (explicit) return explicit;

  const metadata = row.metadata;
  if (metadata && typeof metadata === "object") {
    const metadataRecord = metadata as Record<string, unknown>;
    const fromMetadata = asString(metadataRecord.campaign_name) || asString(metadataRecord.campaign);
    if (fromMetadata) return fromMetadata;
  }

  return "uncategorized";
}

function deriveRowMetrics(row: EmailLogRow) {
  const status = asString(row.status)?.toLowerCase() || "";
  const sent = status === "sent" ? 1 : 0;
  const errors = status === "error" ? 1 : 0;

  const delivered = hasDateValue(row.delivered_at) || (sent === 1 && errors === 0) ? 1 : 0;

  const openedCount = Math.max(asNumber(row.opened_count), isOpenEvent(row) ? 1 : 0);
  const clickedCount = Math.max(asNumber(row.clicked_count), isClickEvent(row) ? 1 : 0);

  const opened = openedCount > 0 ? 1 : 0;
  const clicked = clickedCount > 0 ? 1 : 0;

  return {
    sent,
    errors,
    delivered,
    opened,
    clicked,
    openedCount,
    clickedCount,
  };
}

function clampDays(value: number): number {
  if (!Number.isFinite(value)) return 30;
  return Math.min(Math.max(Math.trunc(value), 1), 365);
}

export async function GET(req: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({ error: "Supabase client config missing" }, { status: 500 });
    }

    const cookieStore = await cookies();

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    });

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const requestUrl = new URL(req.url);
    const days = clampDays(Number(requestUrl.searchParams.get("days") || 30));
    const sinceIso = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from("email_logs")
      .select("*")
      .gte("created_at", sinceIso)
      .order("created_at", { ascending: false })
      .limit(5000);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const rows = (data || []) as EmailLogRow[];
    const byCampaign = new Map<string, CampaignAccumulator>();

    let sent = 0;
    let delivered = 0;
    let opened = 0;
    let clicked = 0;
    let errorsCount = 0;
    let openedEvents = 0;
    let clickedEvents = 0;

    for (const row of rows) {
      const metrics = deriveRowMetrics(row);
      const campaignName = resolveCampaignName(row);

      sent += metrics.sent;
      delivered += metrics.delivered;
      opened += metrics.opened;
      clicked += metrics.clicked;
      errorsCount += metrics.errors;
      openedEvents += metrics.openedCount;
      clickedEvents += metrics.clickedCount;

      if (!byCampaign.has(campaignName)) {
        byCampaign.set(campaignName, {
          campaignName,
          sent: 0,
          delivered: 0,
          opened: 0,
          clicked: 0,
          errors: 0,
        });
      }

      const accumulator = byCampaign.get(campaignName);
      if (!accumulator) continue;

      accumulator.sent += metrics.sent;
      accumulator.delivered += metrics.delivered;
      accumulator.opened += metrics.opened;
      accumulator.clicked += metrics.clicked;
      accumulator.errors += metrics.errors;
    }

    const campaigns = Array.from(byCampaign.values())
      .map((campaign) => ({
        ...campaign,
        openRate: toRate(campaign.opened, campaign.delivered),
        clickRate: toRate(campaign.clicked, campaign.delivered),
        ctor: toRate(campaign.clicked, campaign.opened),
      }))
      .sort((a, b) => b.sent - a.sent);

    return NextResponse.json({
      ok: true,
      windowDays: days,
      generatedAt: new Date().toISOString(),
      summary: {
        sent,
        delivered,
        opened,
        clicked,
        errors: errorsCount,
        openedEvents,
        clickedEvents,
        openRate: toRate(opened, delivered),
        clickRate: toRate(clicked, delivered),
        ctor: toRate(clicked, opened),
      },
      campaigns,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
