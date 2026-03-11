"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Input from "@/components/ui/Input"
import Button from "@/components/ui/Button"

export default function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleLogin() {
    setError(null)
    setLoading(true)
    try {
      const res = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json?.error || 'Login failed')
      } else {
        router.push('/dashboard')
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-gradient-to-br dark:from-ferkous-900 dark:via-slate-950 dark:to-black px-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-900/80 backdrop-blur border border-slate-100 dark:border-slate-800 rounded-2xl shadow-xl p-8">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Connexion à FerkousFlow</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">Entrez vos identifiants pour accéder au CRM</p>

        <div className="mt-6 space-y-4">
          <Input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Input type="password" placeholder="Mot de passe" value={password} onChange={(e) => setPassword(e.target.value)} />

          <Button onClick={handleLogin} disabled={loading} className="w-full">
            {loading ? 'Connexion…' : 'Se connecter'}
          </Button>

          <div className="flex justify-between text-sm">
            <Link href="/signup" className="text-ferkous-500 hover:underline">S&apos;inscrire</Link>
            <Link href="/forgot" className="text-ferkous-500 hover:underline">Mot de passe oublié</Link>
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}
        </div>
      </div>
    </div>
  )
}