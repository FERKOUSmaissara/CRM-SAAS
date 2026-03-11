import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function POST(req: Request) {
  try {
    const { access_token, refresh_token } = await req.json()
    if (!access_token || !refresh_token) {
      return NextResponse.json({ error: 'Missing tokens' }, { status: 400 })
    }

    const cookieStore = await cookies()

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: (cookiesToSet) => {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          },
        },
      }
    )
    const { data, error } = await supabase.auth.setSession({ access_token, refresh_token })
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    const user = data?.user ?? null

    // Ensure profile exists
    if (user) {
      const { data: existing } = await supabase.from('profiles').select('id').eq('id', user.id).maybeSingle()
      if (!existing) {
        await supabase.from('profiles').insert({ id: user.id, email: user.email, full_name: null, role: 'user' })
      }
    }

    return NextResponse.json({ user })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 })
  }
}
