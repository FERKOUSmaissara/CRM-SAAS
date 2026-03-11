"use client"
export const dynamic = "force-dynamic"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Card from '@/components/ui/Card'
import { TrendingUp } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'

const supabase = createClient()

type Lead = {
  id: string
  title: string | null
  email: string | null
  status: string
  estimated_value: number | null
  source: string | null
  created_at: string | null
}

function statusClass(status: string) {
  switch (status) {
    case 'new':
      return 'bg-[#99f6e4]/40 text-[#0d3d36]'
    case 'in_progress':
      return 'bg-[#f97316]/15 text-[#c2410c]'
    case 'converted':
      return 'bg-[#2dd4bf]/25 text-[#115e59]'
    case 'lost':
      return 'bg-gray-100 text-gray-700'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

function statusLabel(status: string) {
  if (status === 'new') return 'Nouveau'
  if (status === 'in_progress') return 'En cours'
  if (status === 'converted') return 'Converti'
  if (status === 'lost') return 'Perdu'
  return status
}

export default function LeadsPage() {
  const searchParams = useSearchParams()
  const created = searchParams?.get('created')
  const [leads, setLeads] = useState<Lead[]>([])
  const [sendingEmailId, setSendingEmailId] = useState<string | null>(null)
  const [emailStatus, setEmailStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchLeads = async () => {
    setError(null)
    try {
      const { data, error: fetchError } = await supabase
        .from('leads')
        .select('id,title,status,source,created_at,email,estimated_value')
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError

      setLeads(data || [])
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err))
    }
  }

  useEffect(() => {
    void fetchLeads()
  }, [])

  async function deleteLead(id: string) {
    const { error } = await supabase
      .from("leads")
      .delete()
      .eq("id", id);

    if (error) {
      console.error(error);
      setError("Impossible de supprimer le prospect.");
      return;
    }

    fetchLeads();
  }

  const handleSendEmail = async (leadId: string) => {
    setError(null)
    setEmailStatus(null)

    try {
      setSendingEmailId(leadId)

      const res = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId,
          eventType: 'manual_followup',
          campaignName: 'manual_lead_outreach',
          source: 'manual',
        }),
      })

      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(json?.error || "Echec de l'envoi de l'email")
        return
      }

      setEmailStatus('Email envoyé avec succès')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setSendingEmailId(null)
    }
  }

  return (
    <div className="px-6 py-6 space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-white">Prospects</h1>
        <p className="text-slate-400 mt-1">Gérez votre pipeline commercial</p>
      </div>

      <div className="flex items-center justify-between">
        <Link href="/dashboard/leads/new" className="btn-primary inline-flex h-10 items-center text-sm">
          ➕ Nouveau prospect
        </Link>
      </div>

      {created && (
        <div className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold bg-[#99f6e4]/40 text-[#0d3d36]">
          Prospect créé avec succès ✅
        </div>
      )}

      {error ? <div className="text-sm text-red-500">{error}</div> : null}
      {emailStatus ? <div className="text-sm text-emerald-500">{emailStatus}</div> : null}

      <Card>
        <div className="p-4 overflow-x-auto">
          {leads.length === 0 ? (
            <div className="py-10 flex flex-col items-center text-center">
              <TrendingUp className="h-8 w-8 text-gray-400" />
              <h3 className="mt-3 text-sm font-semibold text-gray-900">Aucun prospect</h3>
              <p className="mt-1 text-xs text-gray-500">Ajoutez un prospect pour lancer votre pipeline.</p>
              <Link href="/dashboard/leads/new" className="btn-primary mt-4 h-10 inline-flex items-center text-sm">Créer un prospect</Link>
            </div>
          ) : (
            <table className="min-w-full border border-gray-100 rounded-2xl overflow-hidden">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="h-11 px-4 text-left text-xs text-gray-500 font-semibold">Titre</th>
                  <th className="h-11 px-4 text-left text-xs text-gray-500 font-semibold">Statut</th>
                  <th className="h-11 px-4 text-left text-xs text-gray-500 font-semibold">Valeur estimée</th>
                  <th className="h-11 px-4 text-left text-xs text-gray-500 font-semibold">Source</th>
                  <th className="h-11 px-4 text-left text-xs text-gray-500 font-semibold">Date</th>
                  <th className="h-11 px-4 text-right text-xs text-gray-500 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead, index) => (
                  <tr key={lead.id} className={`h-12 border-t border-gray-100 hover:bg-gray-50 ${index % 2 === 1 ? 'bg-gray-50/40' : ''}`}>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                      <Link href={`/dashboard/leads/${lead.id}`} className="hover:text-[#0d3d36] hover:underline">
                        {lead.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusClass(lead.status)}`}>
                        {statusLabel(lead.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">{lead.estimated_value ?? '-'}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{lead.source ?? '-'}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {lead.created_at ? new Date(lead.created_at).toLocaleString() : '-'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          onClick={() => void handleSendEmail(lead.id)}
                          disabled={sendingEmailId === lead.id}
                          className="h-8 inline-flex items-center px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition disabled:opacity-60"
                        >
                          {sendingEmailId === lead.id ? 'Envoi…' : 'Envoyer un email'}
                        </button>

                        <button
                          onClick={() => void deleteLead(lead.id)}
                          className="bg-red-500 text-white px-3 py-1 rounded"
                        >
                          Supprimer
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>
    </div>
  )
}
