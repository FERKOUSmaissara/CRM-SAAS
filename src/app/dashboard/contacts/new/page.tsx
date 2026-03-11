"use client"
export const dynamic = "force-dynamic"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import Card from '@/components/ui/Card'
import FormInput from '@/components/ui/FormInput'

const supabase = createClient()

type CompanyOption = {
  id: string
  name: string | null
}

export default function NewContactPage() {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [companyId, setCompanyId] = useState('')
  const [companies, setCompanies] = useState<CompanyOption[]>([])
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<{ first_name?: string; email?: string }>({})
  const router = useRouter()

  useEffect(() => {
    const load = async () => {
      const {
        data: { user }
      } = await supabase.auth.getUser()

      if (!user) return

      const { data } = await supabase
        .from('companies')
        .select('id, name')
        .eq('owner_id', user.id)

      setCompanies(data || [])
    }

    load()
  }, [])

  const handleCreate = async () => {
    setError('')
    const errors: Record<string, string> = {}

    if (!firstName.trim()) {
      errors.first_name = 'Prénom requis'
    }

    if (!email.trim()) {
      errors.email = 'Email requis'
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }

    setFieldErrors({})

    const {
      data: { user }
    } = await supabase.auth.getUser()

    if (!user) {
      setError('Utilisateur non connecté')
      return
    }

    const { error } = await supabase.from('contacts').insert([
      {
        first_name: firstName,
        last_name: lastName || null,
        email,
        phone: phone || null,
        owner_id: user.id,
        company_id: companyId || null
      }
    ])

    if (error) {
      setError(error.message)
    } else {
      router.push('/dashboard/contacts?created=true')
    }
  }

  return (
    <div className="px-6 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Créer un contact</h1>
          <p className="text-sm text-gray-400">Ajoutez un nouveau contact client</p>
        </div>
        <Link href="/dashboard/contacts" className="h-10 inline-flex items-center px-4 rounded-2xl border border-gray-200 text-sm text-gray-700 hover:bg-gray-50">Retour</Link>
      </div>

      <Card className="max-w-3xl">
        <div className="space-y-4">
          <label className="block">
            <span className="block text-sm font-semibold text-gray-900">Nom</span>
            <FormInput className="mt-1" placeholder="Nom du contact" value={lastName} onChange={(e) => setLastName(e.target.value)} />
          </label>

          <label className="block">
            <span className="block text-sm font-semibold text-gray-900">Prénom</span>
            <FormInput className={`mt-1 ${fieldErrors.first_name ? 'border-red-500' : ''}`} placeholder="Prénom du contact" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            {fieldErrors.first_name && <p className="text-red-500 text-sm mt-1">{fieldErrors.first_name}</p>}
          </label>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="block">
              <span className="block text-sm font-semibold text-gray-900">Email</span>
              <FormInput className={`mt-1 ${fieldErrors.email ? 'border-red-500' : ''}`} placeholder="email@exemple.com" value={email} onChange={(e) => setEmail(e.target.value)} />
              {fieldErrors.email && <p className="text-red-500 text-sm mt-1">{fieldErrors.email}</p>}
            </label>

            <label className="block">
              <span className="block text-sm font-semibold text-gray-900">Téléphone</span>
              <FormInput className="mt-1" placeholder="06 00 00 00 00" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </label>
          </div>

          <label className="block">
            <span className="block text-sm font-semibold text-gray-900">Entreprise associée</span>
            <select className="input-modern mt-1" value={companyId} onChange={(e) => setCompanyId(e.target.value)}>
              <option value="">Sélectionner une entreprise</option>
              {companies?.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </label>

          <div className="flex items-center justify-end gap-2">
            <Link href="/dashboard/contacts" className="h-10 inline-flex items-center px-4 rounded-2xl border border-gray-200 text-sm text-gray-700 hover:bg-gray-50">Annuler</Link>
            <button onClick={handleCreate} className="btn-primary h-10 inline-flex items-center text-sm">Créer le contact</button>
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}
        </div>
      </Card>
    </div>
  )
}
