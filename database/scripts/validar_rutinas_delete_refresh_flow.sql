-- Validación técnica para feature/rutinas-delete-refresh-flow
-- Esta feature no aplica migraciones. La tabla public.rutina no tiene columna activo,
-- por lo tanto el flujo usa eliminación física controlada desde API.

\echo '1. Estructura actual de public.rutina'
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'rutina'
ORDER BY ordinal_position;

\echo '2. Conteo actual de rutinas por socio'
SELECT
  id_socio,
  COUNT(*) AS total_rutinas
FROM public.rutina
GROUP BY id_socio
ORDER BY total_rutinas DESC, id_socio
LIMIT 20;

\echo '3. Últimas rutinas registradas'
SELECT
  id_rutina,
  id_socio,
  nombre,
  semana,
  creado_en,
  actualizado_en
FROM public.rutina
ORDER BY creado_en DESC NULLS LAST, id_rutina DESC
LIMIT 10;
