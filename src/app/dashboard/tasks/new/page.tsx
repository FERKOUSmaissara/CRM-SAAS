"use client"
export const dynamic = "force-dynamic"

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import Card from "@/components/ui/Card";
import FormInput from "@/components/ui/FormInput";

type Profile = { id: string; full_name?: string | null };

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return String(error);
}

export default function NewTaskPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const status = "pending";
  const [dueDate, setDueDate] = useState("");
  const [assignedTo, setAssignedTo] = useState<string | null>(null);

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProfiles();
  }, []);

  async function fetchProfiles() {
    const { data } = await supabase.from("profiles").select("id,full_name").order("full_name", { ascending: true });
    setProfiles((data as Profile[] | null) || []);
  }

  function validate() {
    const errs: Record<string, string> = {};
    if (!title.trim()) errs.title = "Le titre de la tâche est requis";
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!validate()) return;
    setLoading(true);
    try {
      const { data: userData, error: userErr } = await supabase.auth.getUser();
      if (userErr || !userData?.user) throw new Error("Vous devez être connecté pour créer une tâche.");
      const uid = userData.user.id;

      // dueDate is a YYYY-MM-DD string from input type=date — convert to timestamptz
      const due_iso = dueDate ? new Date(dueDate + "T00:00:00Z").toISOString() : null;

      const payload = {
        title: title.trim(),
        description: description || null,
        status: status || "pending",
        due_date: due_iso,
        owner_id: uid,
        assigned_to: assignedTo || null,
      };

      const { error: insertErr } = await supabase.from("tasks").insert(payload).select();
      if (insertErr) throw insertErr;

      router.push("/dashboard/tasks?created=true");
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="px-6 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Créer une tâche</h1>
          <p className="text-sm text-gray-400">Ajoutez une nouvelle tâche à votre planning</p>
        </div>
        <Link href="/dashboard/tasks" className="text-sm text-gray-600 hover:text-gray-900">
          Retour
        </Link>
      </div>

      <Card className="max-w-3xl">
        <form onSubmit={onSubmit} className="space-y-4">
          {error && <div className="text-sm text-red-600">{error}</div>}

          <div>
            <label className="block text-sm font-semibold text-gray-900">Titre de la tâche</label>
            <FormInput
              value={title}
              placeholder="Entrez le titre de la tâche"
              onChange={(e) => setTitle(e.target.value)}
              className={`mt-1 text-sm ${fieldErrors.title ? "border-red-500" : ""}`}
            />
            {fieldErrors.title && <p className="text-xs text-red-600 mt-1">{fieldErrors.title}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900">Description</label>
            <textarea value={description} placeholder="Décrivez la tâche" onChange={(e) => setDescription(e.target.value)} className="input-modern mt-1 text-sm" rows={4} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-900">Date d’échéance</label>
              <FormInput type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="mt-1 text-sm" />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900">Responsable</label>
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
            <button type="submit" disabled={loading} className="btn-primary h-10 inline-flex items-center text-sm disabled:opacity-60">
              {loading ? "Création…" : "Créer la tâche"}
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
}
