import { createBrowserClient } from "@supabase/ssr";

/**
 * Client Supabase côté navigateur.
 *
 * Ce module exporte un singleton `supabase` utilisé par tous les composants
 * "use client" pour interroger la base de données et gérer l'authentification.
 *
 * En production, remplacer les constantes ci-dessous par les variables
 * d'environnement NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY.
 *
 * La clé anonyme (anon key) est publique et sécurisée par les politiques
 * Row Level Security (RLS) définies dans Supabase. Elle n'accorde que les
 * permissions explicitement accordées par les policies.
 */

// TODO: remplacer par process.env.NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY
const HARDCODED_URL = "https://xinielfueapiootcondt.supabase.co";
const HARDCODED_KEY = "sb_publishable_TkRXD9DRg2mal1BHtopQwA_uD9xJLB_";

// Singleton : on réutilise la même instance entre les re-rendus pour éviter
// de créer plusieurs connexions WebSocket simultanées.
let browserClient: ReturnType<typeof createBrowserClient> | null = null;

export function createClient() {
  if (browserClient) return browserClient;
  browserClient = createBrowserClient(HARDCODED_URL, HARDCODED_KEY);
  return browserClient;
}

// Instance par défaut exportée pour un usage direct dans les composants.
export const supabase = createClient();