-- Gym Master - Plan controlado de hardening RLS
-- NO ejecutar completo sin validar que todos los módulos críticos consumen API Routes.
-- Contexto: Gym Master usa JWT propio, no Supabase Auth para autorización de negocio.
-- Por eso, la estrategia recomendada es:
-- 1) Frontend -> API Routes con Authorization Bearer propio.
-- 2) API Routes -> Supabase server client con SUPABASE_SERVICE_ROLE_KEY.
-- 3) Retirar progresivamente policies dev_all_* abiertas cuando ya no haya acceso directo desde cliente.

-- Inventario de policies abiertas:
SELECT
  schemaname,
  tablename,
  policyname,
  cmd,
  roles,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND (
    policyname ILIKE 'dev_%'
    OR qual = 'true'
    OR with_check = 'true'
  )
ORDER BY tablename, policyname;

-- Ejemplo de retiro controlado para una tabla, aplicar solo después de validar módulo:
-- DROP POLICY IF EXISTS dev_all_usuario ON public.usuario;
-- DROP POLICY IF EXISTS "Permitir lectura de usuarios" ON public.usuario;

-- Ejemplo de bloqueo explícito para anon/authenticated si el acceso queda solo por service_role:
-- CREATE POLICY usuario_no_direct_client_access
-- ON public.usuario
-- FOR ALL
-- TO anon, authenticated
-- USING (false)
-- WITH CHECK (false);

-- El service_role seguirá operando desde API Routes del backend.
