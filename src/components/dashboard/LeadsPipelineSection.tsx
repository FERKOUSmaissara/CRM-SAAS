import { X } from "lucide-react";
import { useMemo, useState } from "react";
import type { DashboardData } from "@/hooks/useDashboardData";
import { deleteEntity } from "@/lib/deleteEntity";
import ConfirmModal from "@/components/ui/ConfirmModal";

type Props = {
  data: DashboardData;
  formatCurrency: (value: number) => string;
  selectedFunnelStage: string | null;
  setSelectedFunnelStage: (value: string | null) => void;
  onDeleteSuccess: () => Promise<void> | void;
};

export default function LeadsPipelineSection({
  data,
  formatCurrency,
  selectedFunnelStage,
  setSelectedFunnelStage,
  onDeleteSuccess,
}: Props) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const filteredLeads = useMemo(() => {
    if (!selectedFunnelStage) return data.leads;
    return data.leads.filter((l) => l.status === selectedFunnelStage);
  }, [selectedFunnelStage, data.leads]);

  const filteredPipelineValue = useMemo(() => {
    return filteredLeads.reduce((sum, l) => sum + (l.estimated_value || 0), 0);
  }, [filteredLeads]);

  const formatStatusLabel = (status: string | null) => {
    if (!status) return "";
    if (status === "new") return "Nouveau";
    if (status === "in_progress") return "En cours";
    if (status === "proposal") return "Proposition";
    if (status === "negotiation") return "Négociation";
    if (status === "converted") return "Converti";
    if (status === "lost") return "Perdu";
    return status;
  };

  const requestDelete = (id: string) => {
    setPendingDeleteId(id);
  };

  const confirmDelete = async () => {
    if (!pendingDeleteId) return;

    setError(null);
    try {
      setDeletingId(pendingDeleteId);
      await deleteEntity("leads", pendingDeleteId);
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
      <div className="mb-5">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Prospects et pipeline</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">Entonnoir, liste et filtre</p>
      </div>

      {error ? <div className="mb-4 text-sm text-red-500">{error}</div> : null}

      <div className="bg-white dark:bg-slate-900/80 backdrop-blur border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm p-5 mb-6 hover:shadow-lg hover:-translate-y-0.5 transition-all">
        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-4">Entonnoir commercial</h3>

        <div className="space-y-4">
          {data.funnel.data.map((stage) => {
            const pct = data.funnel.total > 0 ? (stage.value / data.funnel.total) * 100 : 0;
            const isActive = selectedFunnelStage === stage.status;

            return (
              <div
                key={stage.name}
                onClick={() => setSelectedFunnelStage(isActive ? null : stage.status)}
                className={`cursor-pointer transition-all duration-300 p-3 rounded-lg ${
                  isActive ? "bg-slate-50 dark:bg-slate-800/60 ring-2 ring-ferkous-500" : "hover:bg-slate-50 dark:hover:bg-slate-800/40"
                }`}
              >
                <div className="flex justify-between mb-1">
                  <span className="font-medium text-slate-900 dark:text-slate-100">{formatStatusLabel(stage.status)}</span>
                  <span className="text-sm text-slate-500 dark:text-slate-400">
                    {stage.value} ({pct.toFixed(1)}%)
                  </span>
                </div>

                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 transition-colors">
                  <div
                    className="h-3 rounded-full transition-all duration-500 bg-gradient-to-r from-ferkous-500 to-emerald-400"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900/80 backdrop-blur border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all">
        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span>Prospects {selectedFunnelStage ? `- ${formatStatusLabel(selectedFunnelStage)}` : ""}</span>

            {selectedFunnelStage ? (
              <span className="text-xs px-3 py-1 rounded-full bg-ferkous-50 text-ferkous-700 dark:bg-ferkous-900/40 dark:text-ferkous-400 font-medium flex items-center gap-2 transition-colors">
                ● Filtre actif
                <button
                  onClick={() => setSelectedFunnelStage(null)}
                  aria-label="Effacer le filtre d'entonnoir"
                  title="Effacer le filtre"
                  className="text-ferkous-700 dark:text-ferkous-400 hover:text-red-500 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-ferkous-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-900 rounded"
                >
                  <X size={14} />
                </button>
              </span>
            ) : null}
          </div>

          <span className="text-ferkous-500 font-semibold">{formatCurrency(filteredPipelineValue)}</span>
        </h3>

        <div className="max-h-[420px] overflow-auto">
          <div className="space-y-3">
            {filteredLeads.slice(0, 10).map((l) => (
              <div key={l.id} className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition p-1 rounded">
                <div>
                  <div className="font-medium text-slate-900 dark:text-slate-100">{l.title}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">{l.companies?.name || "—"} • {l.source || "—"}</div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{formatCurrency(l.estimated_value || 0)}</span>
                  <span
                    className={`text-xs px-2 py-1 rounded-full font-medium ${
                      l.status === "new"
                        ? "bg-blue-100 text-blue-600"
                        : l.status === "in_progress"
                          ? "bg-yellow-100 text-yellow-700"
                          : l.status === "converted"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-red-100 text-red-700"
                    }`}
                  >
                    {formatStatusLabel(l.status)}
                  </span>
                  <button
                    onClick={() => requestDelete(l.id)}
                    disabled={deletingId === l.id}
                    className="h-8 inline-flex items-center px-3 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition disabled:opacity-60"
                  >
                    {deletingId === l.id ? "Suppression…" : "Supprimer"}
                  </button>
                </div>
              </div>
            ))}
            {filteredLeads.length === 0 ? <div className="text-sm text-slate-500 dark:text-slate-400">Aucun prospect.</div> : null}
          </div>
        </div>
      </div>

      <ConfirmModal
        open={pendingDeleteId !== null}
        title="Supprimer ce prospect ?"
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
