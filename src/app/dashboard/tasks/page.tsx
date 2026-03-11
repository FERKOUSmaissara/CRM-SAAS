"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { fetchTasksForOwner, type TaskRow, type TaskStatusFilter } from "@/lib/tasks";
import Card from '@/components/ui/Card'
import { deleteEntity } from "@/lib/deleteEntity";
import { CheckSquare } from "lucide-react";
import ConfirmModal from "@/components/ui/ConfirmModal";
export const dynamic = "force-dynamic";

type ProfileRow = {
  id: string;
  full_name: string | null;
};

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return String(error);
}

export default function TasksPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const created = searchParams?.get("created") === "true";
  const updated = searchParams?.get("updated") === "true";
  const deleted = searchParams?.get("deleted") === "true";
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<TaskStatusFilter>("all");
  const [assignedMap, setAssignedMap] = useState<Record<string, string>>({});

  const statusOptions = useMemo<TaskStatusFilter[]>(() => ["all", "pending", "in_progress", "done"], []);

  useEffect(() => {
    fetchTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  async function fetchTasks() {
    setLoading(true);
    setError(null);
    try {
      const {
        data: userData,
        error: userErr,
      } = await supabase.auth.getUser();

      if (userErr || !userData?.user) {
        setError("Vous devez être connecté pour voir les tâches.");
        setTasks([]);
        setLoading(false);
        return;
      }

      const uid = userData.user.id;

      const items = await fetchTasksForOwner(uid, statusFilter);
      setTasks(items);

      // Fetch assigned profiles in batch
      const assignedIds = Array.from(new Set(items.map((t) => t.assigned_to).filter(Boolean))) as string[];
      if (assignedIds.length > 0) {
        const { data: profiles } = await supabase.from("profiles").select("id,full_name").in("id", assignedIds);
        const map: Record<string, string> = {};
        (profiles as ProfileRow[] | null || []).forEach((p) => (map[p.id] = p.full_name || p.id));
        setAssignedMap(map);
      } else {
        setAssignedMap({});
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  function formatDate(d?: string | null) {
    if (!d) return "—";
    try {
      return new Date(d).toLocaleString();
    } catch {
      return d;
    }
  }

  function statusBadge(status?: string | null) {
    const s = status || "pending";
    const base = "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold";
    if (s === "pending") return <span className={`${base} bg-[#f97316]/15 text-[#c2410c]`}>En attente</span>;
    if (s === "in_progress") return <span className={`${base} bg-[#99f6e4]/40 text-[#0d3d36]`}>En cours</span>;
    if (s === "done") return <span className={`${base} bg-[#2dd4bf]/25 text-[#115e59]`}>Terminée</span>;
    return <span className={`${base} bg-gray-100 text-gray-800`}>{s}</span>;
  }

  const requestDeleteTask = (id: string) => {
    setPendingDeleteId(id);
  };

  const confirmDeleteTask = async () => {
    if (!pendingDeleteId) return;

    try {
      setDeletingId(pendingDeleteId);
      await deleteEntity("tasks", pendingDeleteId);
      await fetchTasks();
      router.replace("/dashboard/tasks?deleted=true");
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setDeletingId(null);
      setPendingDeleteId(null);
    }
  };

  return (
    <div className="px-6 py-6 space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-white">Tâches</h1>
        <p className="text-slate-400 mt-1">Vos tâches et rappels personnels</p>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as TaskStatusFilter)}
            className="input-modern h-10 w-auto text-sm text-gray-700"
          >
            {statusOptions.map((s) => (
              <option key={s} value={s}>
                {s === "all" ? "Tous les statuts" : s === "pending" ? "En attente" : s === "in_progress" ? "En cours" : s === "done" ? "Terminée" : s.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        </div>

        <div>
          <Link href="/dashboard/tasks/new" className="btn-primary inline-flex h-10 items-center text-sm">
            Nouvelle tâche
          </Link>
        </div>
      </div>

      {created && (
        <div className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold bg-[#99f6e4]/40 text-[#0d3d36]">
          Tâche créée avec succès.
        </div>
      )}
      {updated && (
        <div className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold bg-[#99f6e4]/40 text-[#0d3d36]">
          Tâche mise à jour avec succès.
        </div>
      )}
      {deleted && (
        <div className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold bg-[#99f6e4]/40 text-[#0d3d36]">
          Tâche supprimée avec succès.
        </div>
      )}

      <Card>
        {loading ? (
          <div className="p-6 text-center">Chargement des tâches...</div>
        ) : error ? (
          <div className="p-6 text-center text-red-600">{error}</div>
        ) : tasks.length === 0 ? (
          <div className="py-10 flex flex-col items-center text-center">
            <CheckSquare className="h-8 w-8 text-gray-400" />
            <h3 className="mt-3 text-sm font-semibold text-gray-900">Aucune tâche pour le moment</h3>
            <p className="mt-1 text-xs text-gray-500">Créez votre première tâche pour rester organisé.</p>
            <Link href="/dashboard/tasks/new" className="btn-primary mt-4 h-10 inline-flex items-center text-sm">
              Créer une tâche
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto p-4">
            <table className="min-w-full border border-gray-100 rounded-2xl overflow-hidden">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="h-11 px-4 text-left text-xs text-gray-500 font-semibold">Titre</th>
                  <th className="h-11 px-4 text-left text-xs text-gray-500 font-semibold">Statut</th>
                  <th className="h-11 px-4 text-left text-xs text-gray-500 font-semibold">Date d&apos;échéance</th>
                  <th className="h-11 px-4 text-left text-xs text-gray-500 font-semibold">Assigné à</th>
                  <th className="h-11 px-4 text-right text-xs text-gray-500 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((t, index) => (
                  <tr key={t.id} className={`h-12 border-t border-gray-100 hover:bg-gray-50 ${index % 2 === 1 ? 'bg-gray-50/40' : ''}`}>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-gray-900">{t.title || "Sans titre"}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{statusBadge(t.status)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-500">{formatDate(t.due_date)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-500">{t.assigned_to ? assignedMap[t.assigned_to] || t.assigned_to : "—"}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">
                      <div className="inline-flex items-center gap-2 justify-end">
                        <Link href={`/dashboard/tasks/${t.id}/edit`} className="h-9 inline-flex items-center px-3 rounded-2xl border border-gray-200 text-xs text-gray-700 hover:bg-gray-50">Modifier</Link>
                        <button
                          onClick={() => requestDeleteTask(t.id)}
                          disabled={deletingId === t.id}
                          className="h-9 inline-flex items-center px-3 rounded-2xl bg-red-600 hover:bg-red-700 text-xs text-white font-semibold transition disabled:opacity-50"
                        >
                          {deletingId === t.id ? "Suppression…" : "Supprimer"}
                        </button>
                      </div>
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
        title="Supprimer cette tâche ?"
        description="Cette action est irréversible."
        loading={pendingDeleteId !== null && deletingId === pendingDeleteId}
        onCancel={() => {
          if (!deletingId) setPendingDeleteId(null);
        }}
        onConfirm={() => void confirmDeleteTask()}
      />
    </div>
  );
}
