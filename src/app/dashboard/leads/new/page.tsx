"use client"
export const dynamic = "force-dynamic"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'
import Card from '@/components/ui/Card'
import FormInput from '@/components/ui/FormInput'

const supabase = createClient()

type Profile = { id: string; full_name?: string | null }
type CompanyOption = { id: string; name: string | null }

export default function NewLeadPage() {
  const [title, setTitle] = useState('')
  const [companyId, setCompanyId] = useState('')
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('new')
  const [estimatedValue, setEstimatedValue] = useState('')
  const [source, setSource] = useState('')
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<{ title?: string }>({})
  const [userId, setUserId] = useState<string | null>(null)
  const [users, setUsers] = useState<Profile[]>([])
  const [companies, setCompanies] = useState<CompanyOption[]>([])
  const [assignedTo, setAssignedTo] = useState<string>('')
  const router = useRouter()

  useEffect(() => {
    const loadUser = async () => {
      const {
        data: { user }
      } = await supabase.auth.getUser()

      setUserId(user?.id ?? null)
      if (!user) return

      // load profiles for assign select
      const { data: profiles } = await supabase.from('profiles').select('id, full_name')
      setUsers((profiles as Profile[] | null) || [])

      const { data: companiesData } = await supabase
        .from('companies')
        .select('id, name')
        .eq('owner_id', user.id)
      setCompanies((companiesData as CompanyOption[] | null) || [])
    }

    loadUser()
  }, [])

  const handleCreate = async () => {
    setError('')

    const errors: Record<string, string> = {}
    if (!title.trim()) {
      errors.title = 'Le nom du prospect est requis'
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }

    setFieldErrors({})

    if (!userId) {
      setError('Utilisateur non connecté')
      return
    }

    const payload: {
      title: string
      email: string | null
      status: string
      source: string | null
      owner_id: string
      estimated_value?: number | null
      company_id: string | null
      assigned_to: string | null
    } = {
      title,
      email: email.trim() || null,
      status,
      source: source || null,
      owner_id: userId,
      company_id: companyId || null,
      assigned_to: assignedTo || null,
    }

    if (estimatedValue.trim()) {
      const n = Number(estimatedValue)
      payload.estimated_value = Number.isFinite(n) ? n : null
    }

    const { error: insertError } = await supabase.from('leads').insert(payload)

    if (insertError) {
      setError(insertError.message)
    } else {
      router.push('/dashboard/leads?created=true')
    }
  }

  return (
    <div className="px-6 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Créer un prospect</h1>
          <p className="text-sm text-gray-400">Ajoutez une opportunité au pipeline</p>
        </div>
        <Link href="/dashboard/leads" className="h-10 inline-flex items-center px-4 rounded-2xl border border-gray-200 text-sm text-gray-700 hover:bg-gray-50">
          Retour
        </Link>
      </div>

      <Card className="max-w-3xl">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-900">Nom du prospect</label>
            <FormInput
              className={`mt-1 ${fieldErrors.title ? 'border-red-500' : ''}`}
              placeholder="Nom du prospect"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            {fieldErrors.title && <p className="text-red-500 text-sm mt-1">{fieldErrors.title}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <label className="block">
                <span className="block text-sm font-semibold text-gray-900">Entreprise</span>
                <select
                  className="input-modern mt-1"
                  value={companyId}
                  onChange={(e) => setCompanyId(e.target.value)}
                >
                  <option value="">Sélectionner une entreprise</option>
                  {companies.map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="block text-sm font-semibold text-gray-900">Email du prospect</span>
                <FormInput
                  type="email"
                  placeholder="email@entreprise.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1"
                />
              </label>
            </div>

            <label className="block">
              <span className="block text-sm font-semibold text-gray-900">Source du prospect</span>
              <FormInput
                className="mt-1"
                placeholder="Ex : Site web, Réseau, Publicité"
                value={source}
                onChange={(e) => setSource(e.target.value)}
              />
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="block">
              <span className="block text-sm font-semibold text-gray-900">Statut</span>
              <select
                className="input-modern mt-1"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="new">Nouveau</option>
                <option value="in_progress">En cours</option>
                <option value="converted">Converti</option>
                <option value="lost">Perdu</option>
              </select>
            </label>

            <label className="block">
              <span className="block text-sm font-semibold text-gray-900">Valeur estimée</span>
              <FormInput
                className="mt-1"
                placeholder="Ex : 15 000"
                value={estimatedValue}
                onChange={(e) => setEstimatedValue(e.target.value)}
                inputMode="decimal"
              />
            </label>
          </div>

          <label className="block">
            <span className="block text-sm font-semibold text-gray-900">Responsable</span>
            <select
              className="input-modern mt-1"
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
            >
              <option value="">Non assigné</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.full_name}
                </option>
              ))}
            </select>
          </label>

          <div className="flex items-center justify-end gap-2">
            <Link href="/dashboard/leads" className="h-10 inline-flex items-center px-4 rounded-2xl border border-gray-200 text-sm text-gray-700 hover:bg-gray-50">
              Annuler
            </Link>
            <button onClick={handleCreate} className="btn-primary h-10 inline-flex items-center">
              Créer le prospect
            </button>
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}
        </div>
      </Card>
    </div>
  )
}
