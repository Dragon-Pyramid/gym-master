-- Gym Master - Preflight de integridad core
-- Ejecutar antes de aplicar migraciones de integridad/RLS.
-- Este script NO modifica datos.

-- 1) Usuarios socio sin perfil asociado en tabla socio.
SELECT
  u.id AS usuario_id,
  u.email,
  u.nombre,
  u.rol
FROM public.usuario u
LEFT JOIN public.socio s ON s.usuario_id = u.id
WHERE u.rol = 'socio'
  AND s.id_socio IS NULL
ORDER BY u.creado_en DESC;

-- 2) Perfiles socio duplicados por usuario_id.
SELECT
  usuario_id,
  COUNT(*) AS cantidad_perfiles
FROM public.socio
WHERE usuario_id IS NOT NULL
GROUP BY usuario_id
HAVING COUNT(*) > 1
ORDER BY cantidad_perfiles DESC;

-- 3) Socios sin usuario asociado.
SELECT
  s.id_socio,
  s.nombre_completo,
  s.email,
  s.dni,
  s.activo
FROM public.socio s
WHERE s.usuario_id IS NULL
ORDER BY s.creado_en DESC;

-- 4) Socios con usuario_id inválido.
SELECT
  s.id_socio,
  s.usuario_id,
  s.nombre_completo,
  s.email
FROM public.socio s
LEFT JOIN public.usuario u ON u.id = s.usuario_id
WHERE s.usuario_id IS NOT NULL
  AND u.id IS NULL;

-- 5) Policies dev abiertas que deben retirarse cuando el frontend deje de consultar Supabase directo.
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

-- 6) Tablas públicas con RLS activo.
SELECT
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
