import { createServerClient } from "@supabase/ssr"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

/**
 * Middleware de protection des routes.
 *
 * Intercepte chaque requête vers /dashboard/* et vérifie que l'utilisateur
 * possède une session Supabase valide. Si la session est absente ou expirée,
 * l'utilisateur est redirigé vers /login.
 *
 * Le client Supabase est instancié à partir des cookies de la requête entrante,
 * conformément au pattern SSR (Server-Side Rendering) de @supabase/ssr.
 */
export async function middleware(req: NextRequest) {
  const res = NextResponse.next()

  // Client Supabase SSR : lit et écrit la session dans les cookies HTTP.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return req.cookies.get(name)?.value
        },
        set(name, value, options) {
          res.cookies.set({ name, value, ...options })
        },
        remove(name, options) {
          res.cookies.set({ name, value: "", ...options })
        },
      },
    }
  )

  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Redirection vers /login si l'utilisateur n'est pas authentifié.
  if (!session && req.nextUrl.pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  return res
}

// Le middleware ne s'exécute que pour les routes du dashboard.
export const config = {
  matcher: ["/dashboard/:path*"],
}