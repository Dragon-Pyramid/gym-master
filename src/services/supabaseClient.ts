import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Faltan variables de entorno NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY"
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Cliente único de Supabase.
 *
 * Gym Master deja de resolver la base por un identificador de gimnasio: cada gimnasio tendrá
 * su propio deployment/URL y sus propias variables de entorno.
 */
export const getSupabaseClient = (): SupabaseClient => supabase;
