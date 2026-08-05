import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Faltan variables de entorno NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY"
  );
}

/**
 * Cliente público para Auth helpers y canales Realtime ejecutados en navegador.
 *
 * La anon key es pública por diseño. Los módulos browser no deben ejecutar
 * consultas `.from(...)` ni `.rpc(...)` sobre datos de negocio: esas operaciones
 * cruzan las API Routes protegidas por Auth/RBAC. El gate
 * `test:database-rls-boundary` valida esta frontera por grafo de imports.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
