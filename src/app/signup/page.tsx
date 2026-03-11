"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const router = useRouter()

  async function handleSignup() {
    setError(null)
    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas')
      return
    }
    setLoading(true)
    try {
      const redirectTo = `${window.location.origin}/auth/callback`
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, redirectTo }),
      })
      const json = await res.json()
      if (!res.ok) setError(json?.error || 'Signup failed')
      else setSent(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-gradient-to-br dark:from-ferkous-900 dark:via-slate-950 dark:to-black px-4">
        <div className="w-full max-w-md bg-white dark:bg-slate-900/80 backdrop-blur border border-slate-100 dark:border-slate-800 rounded-2xl shadow-xl p-8 text-center">
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Vérifiez votre e‑mail</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">Un e‑mail de confirmation a été envoyé</p>
          <p className="mt-4 text-slate-700 dark:text-slate-300">Merci — vérifiez votre boîte de réception pour confirmer votre compte.</p>
          <Button className="mt-6" onClick={() => router.push('/login')}>Retour à la connexion</Button>
          <div className="mt-4 text-sm">
            <Link href="/login" className="text-ferkous-500 hover:underline">Aller à la connexion</Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-gradient-to-br dark:from-ferkous-900 dark:via-slate-950 dark:to-black px-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-900/80 backdrop-blur border border-slate-100 dark:border-slate-800 rounded-2xl shadow-xl p-8">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Créer un compte FerkousFlow</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">Inscrivez‑vous pour accéder au CRM</p>

        <div className="mt-6 space-y-4">
          <Input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Input type="password" placeholder="Mot de passe" value={password} onChange={(e) => setPassword(e.target.value)} />
          <Input type="password" placeholder="Confirmer le mot de passe" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />

          <Button onClick={handleSignup} disabled={loading} className="w-full">{loading ? 'Envoi…' : 'Créer un compte'}</Button>

          <div className="text-sm text-center">
            <Link href="/login" className="text-ferkous-500 hover:underline">Déjà un compte ? Se connecter</Link>
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}
        </div>
      </div>
    </div>
  )
}
