import { useMemo, useState } from "react";
import type { DashboardData } from "@/hooks/useDashboardData";
import { deleteEntity } from "@/lib/deleteEntity";
import ConfirmModal from "@/components/ui/ConfirmModal";

type Props = {
  data: DashboardData;
  onDeleteSuccess: () => Promise<void> | void;
};

export default function ContactsSection({ data, onDeleteSuccess }: Props) {
  const [q, setQ] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return data.contacts;
    return data.contacts.filter((c) =>
      `${c.first_name || ""} ${c.last_name || ""} ${c.email || ""}`.toLowerCase().includes(s)
    );
  }, [q, data.contacts]);

  const requestDelete = (id: string) => {
    setPendingDeleteId(id);
  };

  const confirmDelete = async () => {
    if (!pendingDeleteId) return;

    setError(null);
    try {
      setDeletingId(pendingDeleteId);
      await deleteEntity("contacts", pendingDeleteId);
      await onDeleteSuccess();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setDeletingId(null);
      setPendingDeleteId(null);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900/80 backdrop-blur border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm p-6 hover:shadow-lg hover:-translate-y-0.5 transition-all">
      <div className="flex items-end justify-between mb-5">
        <div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Contacts</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Récents + recherche</p>
        </div>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Rechercher…"
          className="border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
        />
      </div>

      {error ? <div className="mb-4 text-sm text-red-500">{error}</div> : null}

      <div className="space-y-3">
        {filtered.slice(0, 10).map((c) => (
          <div key={c.id} className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition p-1 rounded pb-3">
            <div>
              <div className="font-medium text-slate-900 dark:text-slate-100">
                {(c.first_name || "") + " " + (c.last_name || "")}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                {c.companies?.name || "—"} • {c.email || "—"}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="text-sm font-medium text-ferkous-500 hover:text-ferkous-600">Voir fiche</button>
              <button
                onClick={() => requestDelete(c.id)}
                disabled={deletingId === c.id}
                className="h-8 inline-flex items-center px-3 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition disabled:opacity-60"
              >
                {deletingId === c.id ? "Suppression…" : "Supprimer"}
              </button>
            </div>
          </div>
        ))}
        {filtered.length === 0 ? <div className="text-sm text-slate-500 dark:text-slate-400">Aucun contact.</div> : null}
      </div>

      <ConfirmModal
        open={pendingDeleteId !== null}
        title="Supprimer ce contact ?"
        description="Cette action est irréversible."
        loading={pendingDeleteId !== null && deletingId === pendingDeleteId}
        onCancel={() => {
          if (!deletingId) setPendingDeleteId(null);
        }}
        onConfirm={() => void confirmDelete()}
      />
    </div>
  );
}
