"use client"
export const dynamic = "force-dynamic"

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Building2 } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import Card from '@/components/ui/Card'
import { deleteEntity } from '@/lib/deleteEntity'
import ConfirmModal from '@/components/ui/ConfirmModal'

const supabase = createClient()

type Company = {
  id: string
  name: string | null
  industry: string | null
}

export default function CompaniesPage() {
  const searchParams = useSearchParams()
  const created = searchParams?.get('created')
  const [companies, setCompanies] = useState<Company[]>([])
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchCompanies = async () => {
    const { data, error: fetchError } = await supabase.from('companies').select('*')

    if (fetchError) {
      setError(fetchError.message)
      return
    }

    setCompanies(data || [])
  }

  useEffect(() => {
    void fetchCompanies()
  }, [])

  const requestDeleteCompany = (id: string) => {
    setPendingDeleteId(id)
  }

  const confirmDeleteCompany = async () => {
    if (!pendingDeleteId) return

    setError(null)
    try {
      setDeletingId(pendingDeleteId)
      await deleteEntity('companies', pendingDeleteId)
      await fetchCompanies()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setDeletingId(null)
      setPendingDeleteId(null)
    }
  }

  return (
    <div className="px-6 py-6 space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-white">Entreprises</h1>
        <p className="text-slate-400 mt-1">Gérez vos entreprises partenaires</p>
      </div>

      <div className="flex items-center justify-between">
        <Link href="/dashboard/companies/new" className="btn-primary inline-flex h-10 items-center text-sm">
          + Ajouter une entreprise
        </Link>
      </div>

      {created && (
        <div className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold bg-[#99f6e4]/40 text-[#0d3d36]">Entreprise créée avec succès ✅</div>
      )}

      {error ? <div className="text-sm text-red-500">{error}</div> : null}

      <Card>
        <div className="overflow-x-auto">
          {companies.length === 0 ? (
            <div className="py-10 flex flex-col items-center text-center">
              <Building2 className="h-8 w-8 text-gray-400" />
              <h3 className="mt-3 text-sm font-semibold text-gray-900">Aucune entreprise</h3>
              <p className="mt-1 text-xs text-gray-500">Créez votre première entreprise pour démarrer.</p>
              <Link href="/dashboard/companies/new" className="btn-primary mt-4 h-10 inline-flex items-center text-sm">Créer une entreprise</Link>
            </div>
          ) : (
            <table className="min-w-full border border-gray-100 rounded-2xl overflow-hidden">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="h-11 px-4 text-left text-xs text-gray-500 font-semibold">Nom</th>
                  <th className="h-11 px-4 text-left text-xs text-gray-500 font-semibold">Industrie</th>
                  <th className="h-11 px-4 text-right text-xs text-gray-500 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {companies.map((company, index) => (
                  <tr key={company.id} className={`h-12 border-t border-gray-100 hover:bg-gray-50 ${index % 2 === 1 ? 'bg-gray-50/40' : ''}`}>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                      <Link href={`/dashboard/companies/${company.id}`} className="hover:text-[#0d3d36] hover:underline">{company.name}</Link>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">{company.industry || '—'}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => requestDeleteCompany(company.id)}
                        disabled={deletingId === company.id}
                        className="h-8 inline-flex items-center px-3 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition disabled:opacity-60"
                      >
                        {deletingId === company.id ? 'Suppression…' : 'Supprimer'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>

      <ConfirmModal
        open={pendingDeleteId !== null}
        title="Supprimer cette entreprise ?"
        description="Cette action est irréversible."
        loading={pendingDeleteId !== null && deletingId === pendingDeleteId}
        onCancel={() => {
          if (!deletingId) setPendingDeleteId(null)
        }}
        onConfirm={() => void confirmDeleteCompany()}
      />
    </div>
  )
}
