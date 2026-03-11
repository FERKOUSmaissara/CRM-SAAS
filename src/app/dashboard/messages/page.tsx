"use client";
export const dynamic = "force-dynamic";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { BarChart3, Mail, MessageSquare } from "lucide-react";
import { supabase } from "@/lib/supabase";
import Card from "@/components/ui/Card";
import { deleteEntity } from "@/lib/deleteEntity";
import ConfirmModal from "@/components/ui/ConfirmModal";

type MessageRow = {
  id: string;
  subject?: string | null;
  title?: string | null;
  content?: string | null;
  body?: string | null;
  message?: string | null;
  created_at?: string | null;
};

type EmailLogRow = {
  id: string;
  created_at?: string | null;
  contact_id?: string | null;
  email?: string | null;
  subject?: string | null;
  campaign_name?: string | null;
  status?: string | null;
  provider?: string | null;
  message_id?: string | null;
  error?: string | null;
  to_email?: string | null;
  provider_message_id?: string | null;
  opened_count?: number | null;
  clicked_count?: number | null;
};

type UiError = {
  message: string;
};

type CampaignStat = {
  campaignName: string;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  errors: number;
  openRate: number;
  clickRate: number;
  ctor: number;
};

function normalizeStatus(status: string | null | undefined): string {
  return (status || "").trim().toLowerCase();
}

function toUiError(error: unknown): UiError {
  if (error && typeof error === "object" && "message" in error) {
    const messageValue = (error as { message?: unknown }).message;
    if (typeof messageValue === "string") {
      return { message: messageValue };
    }
  }

  return { message: String(error) };
}

function toRate(numerator: number, denominator: number): number {
  if (denominator <= 0) return 0;
  return (numerator / denominator) * 100;
}

function isSentStatus(status: string): boolean {
  return ["sent", "delivered", "opened", "clicked"].includes(status);
}

function isDeliveredStatus(status: string): boolean {
  return ["delivered", "opened", "clicked"].includes(status);
}

function isOpenedStatus(status: string): boolean {
  return ["opened", "clicked"].includes(status);
}

function isClickedStatus(status: string): boolean {
  return status === "clicked";
}

export default function MessagesPage() {
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [emailLogs, setEmailLogs] = useState<EmailLogRow[]>([]);

  const [loading, setLoading] = useState(false);
  const [loadingStats, setLoadingStats] = useState(false);

  const [messagesError, setMessagesError] = useState<UiError | null>(null);
  const [emailLogsError, setEmailLogsError] = useState<UiError | null>(null);

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  useEffect(() => {
    void fetchMessages();
    void fetchEmailLogs();
  }, []);

  async function fetchMessages() {
    setLoading(true);
    setMessagesError(null);

    try {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        setMessagesError({ message: error.message });
        setMessages([]);
        return;
      }

      setMessages((data as MessageRow[]) || []);
    } catch (error: unknown) {
      setMessagesError(toUiError(error));
    } finally {
      setLoading(false);
    }
  }

  async function fetchEmailLogs() {
    setLoadingStats(true);
    setEmailLogsError(null);

    try {
      const { data, error } = await supabase
        .from("email_logs")
        .select("*");

      if (error) {
        setEmailLogsError({ message: error.message });
        setEmailLogs([]);
        return;
      }

      setEmailLogs((data as EmailLogRow[]) || []);
    } catch (error: unknown) {
      setEmailLogsError(toUiError(error));
    } finally {
      setLoadingStats(false);
    }
  }

  function requestDeleteMessage(id: string) {
    setPendingDeleteId(id);
  }

  async function confirmDeleteMessage() {
    if (!pendingDeleteId) return;

    try {
      setDeletingId(pendingDeleteId);
      await deleteEntity("messages", pendingDeleteId);
      await fetchMessages();
    } catch (error: unknown) {
      setMessagesError(toUiError(error));
    } finally {
      setDeletingId(null);
      setPendingDeleteId(null);
    }
  }

  function getSubject(row: MessageRow) {
    return row.subject || row.title || "—";
  }

  function getPreview(row: MessageRow) {
    const raw = row.content || row.body || row.message || "";
    return raw.length > 80 ? `${raw.slice(0, 80)}...` : raw || "—";
  }

  function formatDate(value?: string | null) {
    if (!value) return "—";
    try {
      return new Date(value).toLocaleString();
    } catch {
      return value;
    }
  }

  const summary = useMemo(() => {
    const sent = emailLogs?.filter((entry) => isSentStatus(normalizeStatus(entry.status))).length ?? 0;
    const delivered = emailLogs?.filter((entry) => isDeliveredStatus(normalizeStatus(entry.status))).length ?? 0;
    const opened =
      emailLogs?.filter((entry) => {
        const status = normalizeStatus(entry.status);
        const openedCount = Number(entry.opened_count ?? 0);
        return isOpenedStatus(status) || openedCount > 0;
      }).length ?? 0;

    const clicked =
      emailLogs?.filter((entry) => {
        const status = normalizeStatus(entry.status);
        const clickedCount = Number(entry.clicked_count ?? 0);
        return isClickedStatus(status) || clickedCount > 0;
      }).length ?? 0;

    const errors = emailLogs?.filter((entry) => normalizeStatus(entry.status) === "error").length ?? 0;

    return {
      sent,
      delivered,
      opened,
      clicked,
      errors,
      openRate: toRate(opened, delivered),
      clickRate: toRate(clicked, delivered),
      ctor: toRate(clicked, opened),
    };
  }, [emailLogs]);

  const campaignStats = useMemo(() => {
    const map = new Map<string, CampaignStat>();

    for (const row of emailLogs || []) {
      const campaignName = row.campaign_name?.trim() || "non_catégorisée";
      const status = normalizeStatus(row.status);

      if (!map.has(campaignName)) {
        map.set(campaignName, {
          campaignName,
          sent: 0,
          delivered: 0,
          opened: 0,
          clicked: 0,
          errors: 0,
          openRate: 0,
          clickRate: 0,
          ctor: 0,
        });
      }

      const entry = map.get(campaignName);
      if (!entry) continue;

      if (isSentStatus(status)) entry.sent += 1;
      if (isDeliveredStatus(status)) entry.delivered += 1;
      if (isOpenedStatus(status) || Number(row.opened_count ?? 0) > 0) entry.opened += 1;
      if (isClickedStatus(status) || Number(row.clicked_count ?? 0) > 0) entry.clicked += 1;
      if (status === "error") entry.errors += 1;
    }

    return Array.from(map.values())
      .map((entry) => ({
        ...entry,
        openRate: toRate(entry.opened, entry.delivered),
        clickRate: toRate(entry.clicked, entry.delivered),
        ctor: toRate(entry.clicked, entry.opened),
      }))
      .sort((left, right) => right.sent - left.sent);
  }, [emailLogs]);

  return (
    <div className="px-6 py-6 space-y-6">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-white">Emails et messages</h1>
          <p className="text-slate-400 mt-1">Analyses Brevo et historique CRM des messages</p>
        </div>

        <Link href="/dashboard/messages/new" className="btn-primary inline-flex h-10 items-center text-sm">
          Nouvelle campagne
        </Link>
      </div>

      {messagesError ? <div className="text-sm text-red-500">{messagesError?.message}</div> : null}
      {emailLogsError ? <div className="text-sm text-red-500">{emailLogsError?.message}</div> : null}

      <Card>
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-slate-500" />
              <h2 className="text-sm font-semibold text-slate-800">Performance e-mail (table `email_logs`)</h2>
            </div>
            {loadingStats ? <span className="text-xs text-slate-500">Chargement des statistiques...</span> : null}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
            <MiniStat label="ENVOYÉS" value={summary.sent} />
            <MiniStat label="LIVRÉS" value={summary.delivered} />
            <MiniStat label="OUVERTS" value={`${summary.opened} (${summary.openRate.toFixed(1)}%)`} />
            <MiniStat label="CLIQUÉS" value={`${summary.clicked} (${summary.clickRate.toFixed(1)}%)`} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            <MiniStat label="CTOR" value={`${summary.ctor.toFixed(1)}%`} />
            <MiniStat label="ERREURS" value={summary.errors} />
            <MiniStat label="CAMPAGNES" value={campaignStats.length} />
          </div>

          {campaignStats.length > 0 ? (
            <div className="overflow-x-auto rounded-xl border border-gray-100">
              <table className="min-w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="h-10 px-3 text-left text-xs text-gray-500 font-semibold">Campagne</th>
                    <th className="h-10 px-3 text-left text-xs text-gray-500 font-semibold">Envoyés</th>
                    <th className="h-10 px-3 text-left text-xs text-gray-500 font-semibold">Livrés</th>
                    <th className="h-10 px-3 text-left text-xs text-gray-500 font-semibold">Ouverts</th>
                    <th className="h-10 px-3 text-left text-xs text-gray-500 font-semibold">Cliqués</th>
                    <th className="h-10 px-3 text-left text-xs text-gray-500 font-semibold">Taux d’ouverture</th>
                    <th className="h-10 px-3 text-left text-xs text-gray-500 font-semibold">CTR</th>
                  </tr>
                </thead>
                <tbody>
                  {campaignStats.slice(0, 8).map((campaign) => (
                    <tr key={campaign.campaignName} className="h-10 border-t border-gray-100">
                      <td className="px-3 text-xs font-semibold text-gray-700">{campaign.campaignName}</td>
                      <td className="px-3 text-xs text-gray-500">{campaign.sent}</td>
                      <td className="px-3 text-xs text-gray-500">{campaign.delivered}</td>
                      <td className="px-3 text-xs text-gray-500">{campaign.opened}</td>
                      <td className="px-3 text-xs text-gray-500">{campaign.clicked}</td>
                      <td className="px-3 text-xs text-gray-500">{campaign.openRate.toFixed(1)}%</td>
                      <td className="px-3 text-xs text-gray-500">{campaign.clickRate.toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-sm text-gray-500">Aucune statistique de campagne pour le moment.</div>
          )}
        </div>
      </Card>

      <Card>
        {loading ? (
          <div className="p-6 text-center">Chargement des messages...</div>
        ) : messages.length === 0 ? (
          <div className="py-10 flex flex-col items-center text-center">
            <MessageSquare className="h-8 w-8 text-gray-400" />
            <h3 className="mt-3 text-sm font-semibold text-gray-900">Aucun message</h3>
            <p className="mt-1 text-xs text-gray-500">Aucune ligne de message disponible.</p>
          </div>
        ) : (
          <div className="overflow-x-auto p-4">
            <table className="min-w-full border border-gray-100 rounded-2xl overflow-hidden">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="h-11 px-4 text-left text-xs text-gray-500 font-semibold">Objet</th>
                  <th className="h-11 px-4 text-left text-xs text-gray-500 font-semibold">Message</th>
                  <th className="h-11 px-4 text-left text-xs text-gray-500 font-semibold">Date</th>
                  <th className="h-11 px-4 text-right text-xs text-gray-500 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {messages.map((row, index) => (
                  <tr key={row.id} className={`h-12 border-t border-gray-100 hover:bg-gray-50 ${index % 2 === 1 ? "bg-gray-50/40" : ""}`}>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900">{getSubject(row)}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{getPreview(row)}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{formatDate(row.created_at)}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => requestDeleteMessage(row.id)}
                        disabled={deletingId === row.id}
                        className="h-8 inline-flex items-center px-3 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition disabled:opacity-60"
                      >
                        {deletingId === row.id ? "Suppression..." : "Supprimer"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <ConfirmModal
        open={pendingDeleteId !== null}
        title="Supprimer ce message ?"
        description="Cette action est irréversible."
        loading={pendingDeleteId !== null && deletingId === pendingDeleteId}
        onCancel={() => {
          if (!deletingId) setPendingDeleteId(null);
        }}
        onConfirm={() => void confirmDeleteMessage()}
      />
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-3">
      <div className="flex items-center gap-2 text-xs text-gray-500 uppercase tracking-wide">
        <Mail className="h-3.5 w-3.5" />
        {label}
      </div>
      <div className="mt-1 text-sm font-semibold text-gray-800">{value}</div>
    </div>
  );
}
