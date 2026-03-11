"use client"
export const dynamic = "force-dynamic"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import Card from '@/components/ui/Card'
import FormInput from '@/components/ui/FormInput'

const supabase = createClient()

export default function NewCompanyPage() {
  const [name, setName] = useState('')
  const [industry, setIndustry] = useState('')
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<{ name?: string; industry?: string }>({})
  const router = useRouter()

  const handleCreate = async () => {
    setError('')
    const errors: Record<string, string> = {}

    if (!name.trim()) {
      errors.name = 'Nom requis'
    }

    if (!industry.trim()) {
      errors.industry = 'Industrie requise'
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

    const { error } = await supabase.from('companies').insert({
      name,
      industry,
      owner_id: user.id
    })

    if (error) {
      setError(error.message)
    } else {
      router.push('/dashboard/companies?created=true')
    }
  }

  return (
    <div className="px-6 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Créer une entreprise</h1>
          <p className="text-sm text-gray-400">Ajoutez une nouvelle entreprise au CRM</p>
        </div>
        <Link href="/dashboard/companies" className="h-10 inline-flex items-center px-4 rounded-2xl border border-gray-200 text-sm text-gray-700 hover:bg-gray-50">Retour</Link>
      </div>

      <Card className="max-w-3xl">
        <div className="space-y-4">
          <label className="block">
            <span className="block text-sm font-semibold text-gray-900">Nom de l’entreprise</span>
            <FormInput
              className={`mt-1 ${fieldErrors.name ? 'border-red-500' : ''}`}
              placeholder="Entrez le nom de l’entreprise"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            {fieldErrors.name && <p className="text-red-500 text-sm mt-1">{fieldErrors.name}</p>}
          </label>

          <label className="block">
            <span className="block text-sm font-semibold text-gray-900">Secteur d’activité</span>
            <FormInput
              className={`mt-1 ${fieldErrors.industry ? 'border-red-500' : ''}`}
              placeholder="Ex : Technologie, Finance, Marketing"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
            />
            {fieldErrors.industry && <p className="text-red-500 text-sm mt-1">{fieldErrors.industry}</p>}
          </label>

          <div className="flex items-center justify-end gap-2">
            <Link href="/dashboard/companies" className="h-10 inline-flex items-center px-4 rounded-2xl border border-gray-200 text-sm text-gray-700 hover:bg-gray-50">Annuler</Link>
            <button onClick={handleCreate} className="btn-primary h-10 inline-flex items-center text-sm">Créer l’entreprise</button>
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}
        </div>
      </Card>
    </div>
  )
}
