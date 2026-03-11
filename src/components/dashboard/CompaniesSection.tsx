import { useState } from "react";
import type { DashboardData } from "@/hooks/useDashboardData";
import { deleteEntity } from "@/lib/deleteEntity";
import ConfirmModal from "@/components/ui/ConfirmModal";

type Props = {
  data: DashboardData;
  formatCurrency: (value: number) => string;
  onDeleteSuccess: () => Promise<void> | void;
};

export default function CompaniesSection({ data, formatCurrency, onDeleteSuccess }: Props) {
  const top5 = [...data.companies].sort((a, b) => b.pipelineValue - a.pipelineValue).slice(0, 5);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const requestDelete = (id: string) => {
    setPendingDeleteId(id);
  };

  const confirmDelete = async () => {
    if (!pendingDeleteId) return;

    setError(null);
    try {
      setDeletingId(pendingDeleteId);
      await deleteEntity("companies", pendingDeleteId);
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
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Entreprises</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Liste + top 5 par valeur du pipeline</p>
        </div>
      </div>

      {error ? <div className="mb-4 text-sm text-red-500">{error}</div> : null}

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-7">
          <div className="bg-white dark:bg-slate-900/80 backdrop-blur border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all">
            <div className="hidden md:block">
              <div className="max-h-[320px] overflow-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-800 transition-colors">
                    <tr className="text-left text-slate-500 dark:text-slate-400 uppercase tracking-wide text-xs">
                      <th className="p-3 font-semibold">Entreprise</th>
                      <th className="p-3 font-semibold">Contacts</th>
                      <th className="p-3 font-semibold">Prospects</th>
                      <th className="p-3 font-semibold">Pipeline</th>
                      <th className="p-3 font-semibold">Statut</th>
                      <th className="p-3 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.companies.map((c) => (
                      <tr key={c.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                        <td className="p-3">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-ferkous-50 dark:bg-ferkous-900/40 text-ferkous-700 dark:text-ferkous-400 flex items-center justify-center font-semibold transition-colors">
                              {(c.name || "?").slice(0, 1).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-medium text-slate-900 dark:text-slate-100">{c.name}</div>
                              <div className="text-xs text-slate-500 dark:text-slate-400">{c.industry || "—"}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-3 text-slate-700 dark:text-slate-300">{c.totalContacts}</td>
                        <td className="p-3 text-slate-700 dark:text-slate-300">{c.totalLeads}</td>
                        <td className="p-3 font-semibold text-ferkous-500">{formatCurrency(c.pipelineValue)}</td>
                        <td className="p-3">
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${c.isActive ? "bg-ferkous-50 text-ferkous-700 dark:bg-ferkous-900/40 dark:text-ferkous-400" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"}`}>
                            {c.isActive ? "Actif" : "Inactif"}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => requestDelete(c.id)}
                            disabled={deletingId === c.id}
                            className="h-8 inline-flex items-center px-3 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition disabled:opacity-60"
                          >
                            {deletingId === c.id ? "Suppression…" : "Supprimer"}
                          </button>
                        </td>
                      </tr>
                    ))}
                    {data.companies.length === 0 ? (
                      <tr><td className="p-6 text-slate-500 dark:text-slate-400" colSpan={6}>Aucune entreprise.</td></tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="md:hidden space-y-4 p-4">
              {data.companies.map((c) => (
                <div key={c.id} className="bg-white dark:bg-slate-900/80 backdrop-blur border border-slate-100 dark:border-slate-800 rounded-xl shadow-sm p-4 hover:shadow-lg hover:-translate-y-0.5 transition-all">
                  <div className="flex justify-between mb-2">
                    <div className="font-semibold text-slate-900 dark:text-slate-100">{c.name}</div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      c.isActive ? "bg-ferkous-50 text-ferkous-700 dark:bg-ferkous-900/40 dark:text-ferkous-400" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                    }`}>
                      {c.isActive ? "Actif" : "Inactif"}
                    </span>
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-300">
                    Contacts : {c.totalContacts} • Prospects : {c.totalLeads}
                  </div>
                  <div className="mt-2 font-semibold text-ferkous-500">
                    {formatCurrency(c.pipelineValue)}
                  </div>
                  <div className="mt-3">
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
              {data.companies.length === 0 ? <div className="text-sm text-slate-500 dark:text-slate-400">Aucune entreprise.</div> : null}
            </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-5">
          <div className="bg-white dark:bg-slate-900/80 backdrop-blur border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm p-5 h-full hover:shadow-lg hover:-translate-y-0.5 transition-all">
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-4">Top 5 (pipeline)</h3>
            <div className="space-y-3">
              {top5.map((c) => (
                <div key={c.id} className="flex items-center justify-between">
                  <div className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{c.name}</div>
                  <div className="text-sm font-semibold text-ferkous-500">{formatCurrency(c.pipelineValue)}</div>
                </div>
              ))}
              {top5.length === 0 ? <div className="text-sm text-slate-500 dark:text-slate-400">Pas encore de données.</div> : null}
            </div>
          </div>
        </div>
      </div>

      <ConfirmModal
        open={pendingDeleteId !== null}
        title="Supprimer cette entreprise ?"
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
