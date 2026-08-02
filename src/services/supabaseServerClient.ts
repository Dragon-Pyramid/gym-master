import 'server-only';

import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseServer: SupabaseClient | null = null;

/**
 * Cliente Supabase exclusivo para Server Components, API Routes y servicios backend.
 *
 * No importar este archivo desde componentes con `use client`.
 * La service role key nunca debe llegar al bundle del navegador.
 *
 * El cliente privilegiado se inicializa de forma lazy en el primer uso.
 */
export function getSupabaseServerClient(): SupabaseClient {
  if (supabaseServer) {
    return supabaseServer;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error(
      'Faltan variables de entorno NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY'
    );
  }

  supabaseServer = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return supabaseServer;
}
