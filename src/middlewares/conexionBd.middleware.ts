import { getSupabaseClient } from "@/services/supabaseClient";

/**
 * Devuelve el cliente único de Supabase para este deployment.
 *
 * Ya no recibe un identificador de gimnasio porque Gym Master pasa a modo single-tenant:
 * una URL/app + una base de datos por gimnasio.
 */
export function conexionBD() {
  return getSupabaseClient();
}
