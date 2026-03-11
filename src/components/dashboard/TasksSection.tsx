import { useState } from "react";
import type { DashboardData } from "@/hooks/useDashboardData";
import { getTaskTimelineStats } from "@/lib/tasks";
import { deleteEntity } from "@/lib/deleteEntity";
import ConfirmModal from "@/components/ui/ConfirmModal";

type Props = {
  data: DashboardData;
  onDeleteSuccess: () => Promise<void> | void;
};

export default function TasksSection({ data, onDeleteSuccess }: Props) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { todayTasks, overdueTasks, upcomingTasks } = getTaskTimelineStats(data.tasks);

  const requestDelete = (id: string) => {
    setPendingDeleteId(id);
  };

  const confirmDelete = async () => {
    if (!pendingDeleteId) return;

    setError(null);
    try {
      setDeletingId(pendingDeleteId);
      await deleteEntity("tasks", pendingDeleteId);
      await onDeleteSuccess();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setDeletingId(null);
      setPendingDeleteId(null);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900/80 backdrop-blur border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm p-6 min-h-[420px] hover:shadow-lg hover:-translate-y-0.5 transition-all">
      <div className="mb-5">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Tâches et activité</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">Aujourd’hui • Retard • À venir</p>
      </div>

      {error ? <div className="mb-4 text-sm text-red-500">{error}</div> : null}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
        <Mini title="Aujourd’hui" value={todayTasks.length} />
        <Mini title="En retard" value={overdueTasks.length} className="text-red-600" />
        <Mini title="À venir" value={upcomingTasks.length} />
      </div>

      <div className="space-y-3">
        {overdueTasks.slice(0, 4).map((t) => (
          <div key={t.id} className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition p-1 rounded pb-2">
            <div>
              <div className="font-medium text-slate-900 dark:text-slate-100">{t.title}</div>
              <div className="text-xs text-red-500">En retard</div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-700 font-medium">Urgent</span>
              <button
                onClick={() => requestDelete(t.id)}
                disabled={deletingId === t.id}
                className="h-8 inline-flex items-center px-3 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition disabled:opacity-60"
              >
                {deletingId === t.id ? "Suppression…" : "Supprimer"}
              </button>
            </div>
          </div>
        ))}
        {overdueTasks.length === 0 ? <div className="text-sm text-slate-500 dark:text-slate-400">Aucune tâche en retard.</div> : null}
      </div>

      <ConfirmModal
        open={pendingDeleteId !== null}
        title="Supprimer cette tâche ?"
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

function Mini({ title, value, className }: { title: string; value: number; className?: string }) {
  return (
    <div className="bg-white dark:bg-slate-900/80 backdrop-blur border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm p-4 hover:shadow-lg hover:-translate-y-0.5 transition-all">
      <div className="text-sm text-slate-500 dark:text-slate-400">{title}</div>
      <div className={`text-2xl font-semibold text-slate-900 dark:text-slate-100 ${className || ""}`}>{value}</div>
    </div>
  );
}
