"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import Card from "@/components/ui/Card";

type Profile = { id: string; full_name?: string | null };

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return String(error);
}

export default function EditTaskPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("pending");
  const [dueDate, setDueDate] = useState("");
  const [assignedTo, setAssignedTo] = useState<string | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      try {
        const { data: task, error: taskErr } = await supabase.from("tasks").select("id,title,description,status,due_date,assigned_to").eq("id", id).single();
        if (taskErr) throw taskErr;
        setTitle(task.title || "");
        setDescription(task.description || "");
        setStatus(task.status || "pending");
        setAssignedTo(task.assigned_to || null);
        setDueDate(task.due_date ? new Date(task.due_date).toISOString().slice(0, 10) : "");

        const { data: profilesData } = await supabase.from("profiles").select("id,full_name").order("full_name", { ascending: true });
        setProfiles((profilesData as Profile[] | null) || []);
      } catch (err: unknown) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  function validate() {
    const errs: Record<string, string> = {};
    if (!title.trim()) errs.title = "Le titre est requis";
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!validate()) return;
    setSaving(true);
    try {
      const due_iso = dueDate ? new Date(dueDate + "T00:00:00Z").toISOString() : null;
      const payload = {
        title: title.trim(),
        description: description || null,
        status: status || "pending",
        due_date: due_iso,
        assigned_to: assignedTo || null,
      };

      const { error: updateErr } = await supabase.from("tasks").update(payload).eq("id", id);
      if (updateErr) throw updateErr;

      router.push("/dashboard/tasks?updated=true");
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="p-6">Chargement de la tâche...</div>;

  return (
    <div className="px-6 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Modifier la tâche</h1>
          <p className="text-xs text-gray-500">Modifiez les détails de la tâche</p>
        </div>
        <Link href="/dashboard/tasks" className="text-sm text-gray-600 hover:text-gray-900">
          Retour aux tâches
        </Link>
      </div>

      <Card className="max-w-3xl">
        <form onSubmit={onSubmit} className="space-y-4">
          {error && <div className="text-sm text-red-600">{error}</div>}

          <div>
            <label className="block text-sm font-semibold text-gray-900">Titre</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={`input-modern mt-1 text-sm ${fieldErrors.title ? "border-red-500" : ""}`}
            />
            {fieldErrors.title && <p className="text-xs text-red-600 mt-1">{fieldErrors.title}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="input-modern mt-1 text-sm" rows={4} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-900">Statut</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)} className="input-modern mt-1 text-sm">
                <option value="pending">À faire</option>
                <option value="in_progress">En cours</option>
                <option value="done">Terminée</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900">Date d'échéance</label>
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="input-modern mt-1 text-sm" />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900">Assigné à</label>
              <select value={assignedTo || ""} onChange={(e) => setAssignedTo(e.target.value || null)} className="input-modern mt-1 text-sm">
                <option value="">Non assigné</option>
                {profiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.full_name || p.id}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2">
            <Link href="/dashboard/tasks" className="h-10 inline-flex items-center px-4 rounded-2xl border border-gray-200 text-sm text-gray-700 hover:bg-gray-50">
              Annuler
            </Link>
            <button type="submit" disabled={saving} className="btn-primary h-10 inline-flex items-center text-sm disabled:opacity-60">
              {saving ? "Enregistrement…" : "Enregistrer les modifications"}
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
}
