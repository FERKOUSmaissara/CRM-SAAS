import { supabase } from "@/lib/supabase";

/**
 * Module partagé de gestion des tâches.
 *
 * Ce module centralise toutes les requêtes et calculs liés aux tâches CRM.
 * Il est utilisé à la fois par le dashboard (TasksSection) et par la page
 * dédiée aux tâches (/dashboard/tasks) pour garantir une logique cohérente.
 */

/** Filtre de statut applicable aux requêtes de tâches. */
export type TaskStatusFilter = "all" | "pending" | "in_progress" | "done";

/** Représentation d'une ligne tâche retournée par Supabase. */
export type TaskRow = {
  id: string;
  title: string | null;
  description: string | null;
  status: string | null;
  due_date: string | null;
  assigned_to: string | null;
  owner_id: string | null;
  created_at: string | null;
};

// Colonnes sélectionnées à chaque requête — centralisées pour éviter les désynchronisations.
const TASK_SELECT_COLUMNS = "id,title,description,status,due_date,assigned_to,owner_id,created_at";

/**
 * Récupère les tâches appartenant à un utilisateur donné.
 *
 * Les tâches sont filtrées par `owner_id` (RLS Supabase garantit également
 * que seul le propriétaire peut y accéder). Le tri est par date d'échéance
 * croissante pour afficher les tâches les plus urgentes en premier.
 *
 * @param ownerId      - UUID de l'utilisateur connecté
 * @param statusFilter - Filtre optionnel sur le statut (défaut : "all")
 * @returns Liste des tâches correspondant aux critères
 */
export async function fetchTasksForOwner(ownerId: string, statusFilter: TaskStatusFilter = "all") {
  let query = supabase
    .from("tasks")
    .select(TASK_SELECT_COLUMNS)
    .eq("owner_id", ownerId)
    .order("due_date", { ascending: true });

  if (statusFilter !== "all") {
    query = query.eq("status", statusFilter);
  }

  const { data, error } = await query;
  if (error) {
    throw error;
  }

  return (data || []) as TaskRow[];
}

/** Résultat de la répartition des tâches par horizon temporel. */
export type TaskTimelineStats = {
  todayTasks: TaskRow[];     // Tâches dont l'échéance est aujourd'hui
  overdueTasks: TaskRow[];   // Tâches en retard (dues avant aujourd'hui, non terminées)
  upcomingTasks: TaskRow[];  // Tâches dues à partir de demain
  todayCount: number;
  overdueCount: number;
  upcomingCount: number;
};

/**
 * Classe les tâches en trois catégories temporelles : aujourd'hui, en retard, à venir.
 *
 * - Aujourd'hui  : due_date compris dans la journée de referenceDate
 * - En retard    : due_date < aujourd'hui ET statut != "done"
 * - À venir     : due_date >= demain (indépendamment du statut)
 *
 * @param tasks         - Liste des tâches à classer
 * @param referenceDate - Date de référence (défaut : maintenant)
 */
export function getTaskTimelineStats(tasks: TaskRow[], referenceDate = new Date()): TaskTimelineStats {
  const todayStart = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), referenceDate.getDate());
  const tomorrowStart = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), referenceDate.getDate() + 1);

  const todayTasks: TaskRow[] = [];
  const overdueTasks: TaskRow[] = [];
  const upcomingTasks: TaskRow[] = [];

  for (const task of tasks) {
    if (!task.due_date) {
      continue;
    }

    const dueDate = new Date(task.due_date);
    if (Number.isNaN(dueDate.getTime())) {
      continue;
    }

    if (dueDate >= todayStart && dueDate < tomorrowStart) {
      todayTasks.push(task);
      continue;
    }

    if (dueDate < todayStart && (task.status || "").toLowerCase() !== "done") {
      overdueTasks.push(task);
      continue;
    }

    if (dueDate >= tomorrowStart) {
      upcomingTasks.push(task);
    }
  }

  return {
    todayTasks,
    overdueTasks,
    upcomingTasks,
    todayCount: todayTasks.length,
    overdueCount: overdueTasks.length,
    upcomingCount: upcomingTasks.length,
  };
}
