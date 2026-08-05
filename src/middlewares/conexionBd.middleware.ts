import 'server-only';

import { getSupabaseServerClient } from "@/services/supabaseServerClient";

/**
 * Devuelve el cliente privilegiado único para operaciones server-side.
 *
 * Ya no recibe un identificador de gimnasio porque Gym Master funciona en modo
 * single-tenant: una URL/app y una base de datos por gimnasio.
 */
export function conexionBD() {
  return getSupabaseServerClient();
}
