import { createClient } from "@supabase/supabase-js";

/**
 * Client Supabase côté serveur avec la clé `service_role`.
 *
 * Ce client contourne les politiques RLS et dispose d'un accès complet à la
 * base de données. Il doit être utilisé UNIQUEMENT dans les API routes Next.js
 * (dossier `app/api/`) et JAMAIS dans du code client (composants, hooks).
 *
 * La clé SUPABASE_SERVICE_ROLE_KEY est une variable d'environnement privée :
 * elle ne doit jamais être exposée côté navigateur (pas de préfixe NEXT_PUBLIC_).
 */
export function createSupabaseAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Supabase server config missing (NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY)");
  }

  // persistSession: false — les API routes sont sans état (stateless), pas de cookie de session.
  // autoRefreshToken: false — inutile côté serveur, le token ne doit pas être rafraîchi automatiquement.
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
