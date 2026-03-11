"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import PageHeader from '@/components/ui/PageHeader'

export default function AuthCallbackPage() {
  const router = useRouter()
  const [message, setMessage] = useState('Finalisation de la connexion...')

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        // Parse tokens from URL fragment or query
        const url = new URL(window.location.href)
        const hash = url.hash.startsWith('#') ? url.hash.substring(1) : url.hash
        const params = new URLSearchParams(hash || url.search)
        const access_token = params.get('access_token')
        const refresh_token = params.get('refresh_token')

        if (!access_token || !refresh_token) {
          setMessage('Tokens not found. Redirecting to login...')
          setTimeout(() => router.push('/login'), 1200)
          return
        }

        // Send to server to set HTTP-only cookies and ensure profile
        const res = await fetch('/api/auth/set-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ access_token, refresh_token }),
        })
        const json = await res.json()
        if (!res.ok) {
          setMessage(json?.error || 'Session setup failed')
          setTimeout(() => router.push('/login'), 1200)
          return
        }

        if (mounted) router.push('/dashboard')
      } catch (err: any) {
        setMessage(err?.message || String(err))
        setTimeout(() => router.push('/login'), 1500)
      }
    })()
    return () => { mounted = false }
  }, [router])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md">
        <PageHeader title="Authentification" subtitle={message} />
        <div className="card p-6 text-center">
          <p>{message}</p>
        </div>
      </div>
    </div>
  )
}
