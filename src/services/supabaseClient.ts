import { createClient, SupabaseClient } from "@supabase/supabase-js";

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

let serverRuntimeClient: SupabaseClient | null = null;

/**
 * Cliente de datos compatible con módulos compartidos.
 *
 * - Navegador: anon key; cualquier acceso queda sujeto a RLS/grants.
 * - Servidor: service role; solo debe invocarse después de autorización en API.
 *
 * La clave service role se lee únicamente en runtime Node y nunca se exporta.
 */
export const getSupabaseClient = (): SupabaseClient => {
  if (typeof window !== "undefined") {
    return supabase;
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error(
      "Falta SUPABASE_SERVICE_ROLE_KEY para operar la base desde el servidor"
    );
  }

  if (!serverRuntimeClient) {
    serverRuntimeClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  return serverRuntimeClient;
};
