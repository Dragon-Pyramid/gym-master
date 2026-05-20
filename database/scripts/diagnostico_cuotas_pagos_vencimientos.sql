-- =============================================================
-- Gym Master - Diagnóstico de cuotas, pagos y vencimientos
-- Rama: feature/cuotas-pagos-vencimientos
-- Objetivo: auditar el estado real del modelo de cuotas/pagos antes de tocar código o migraciones.
-- Uso local recomendado:
--   docker exec -i supabase_db_gym-master psql -U postgres -d postgres < database/scripts/diagnostico_cuotas_pagos_vencimientos.sql
-- Uso remoto recomendado:
--   Ejecutar por secciones en Supabase SQL Editor, solo lectura.
-- =============================================================

-- 1) Estructura de tablas clave
SELECT
  'columns' AS section,
  table_name,
  ordinal_position,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('cuota', 'historial_precios_cuota', 'pago', 'socio', 'asistencia')
ORDER BY table_name, ordinal_position;

-- 2) Constraints y relaciones
SELECT
  'constraints' AS section,
  tc.table_name,
  tc.constraint_type,
  tc.constraint_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
 AND tc.table_schema = kcu.table_schema
LEFT JOIN information_schema.constraint_column_usage ccu
  ON ccu.constraint_name = tc.constraint_name
 AND ccu.table_schema = tc.table_schema
WHERE tc.table_schema = 'public'
  AND tc.table_name IN ('cuota', 'historial_precios_cuota', 'pago', 'socio', 'asistencia')
ORDER BY tc.table_name, tc.constraint_type, tc.constraint_name;

-- 3) RLS y policies sobre tablas sensibles
SELECT
  'rls' AS section,
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('cuota', 'historial_precios_cuota', 'pago', 'socio', 'asistencia')
ORDER BY tablename;

SELECT
  'policies' AS section,
  schemaname,
  tablename,
  policyname,
  cmd,
  roles,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('cuota', 'historial_precios_cuota', 'pago', 'socio', 'asistencia')
ORDER BY tablename, policyname;

-- 4) Volumen de datos
SELECT 'cuota' AS tabla, COUNT(*) AS total FROM public.cuota
UNION ALL SELECT 'historial_precios_cuota', COUNT(*) FROM public.historial_precios_cuota
UNION ALL SELECT 'pago', COUNT(*) FROM public.pago
UNION ALL SELECT 'socio', COUNT(*) FROM public.socio
UNION ALL SELECT 'asistencia', COUNT(*) FROM public.asistencia
ORDER BY tabla;

-- 5) Historial de cuotas/precios operativos
SELECT
  'cuotas' AS section,
  id,
  descripcion,
  monto,
  periodo,
  fecha_inicio,
  fecha_fin,
  activo,
  creado_en,
  actualizado_en
FROM public.cuota
ORDER BY fecha_inicio DESC, creado_en DESC;

SELECT
  'historial_precios_cuota' AS section,
  h.id,
  h.id_socio,
  s.nombre_completo AS socio,
  h.precio,
  h.fecha_inicio,
  h.fecha_fin
FROM public.historial_precios_cuota h
LEFT JOIN public.socio s ON s.id_socio = h.id_socio
ORDER BY h.fecha_inicio DESC, h.id_socio NULLS FIRST, h.id DESC;

-- 6) Último pago por socio y estado operativo estimado
WITH ultimos_pagos AS (
  SELECT DISTINCT ON (p.socio_id)
    p.socio_id,
    p.id AS pago_id,
    p.fecha_pago,
    p.fecha_vencimiento,
    p.monto_pagado,
    p.cuota_id,
    p.registrado_por,
    p.enviar_email
  FROM public.pago p
  ORDER BY p.socio_id, p.fecha_vencimiento DESC NULLS LAST, p.fecha_pago DESC
), ultima_asistencia AS (
  SELECT
    a.socio_id,
    MAX(a.fecha) AS ultima_asistencia
  FROM public.asistencia a
  GROUP BY a.socio_id
)
SELECT
  'estado_cuota_estimado' AS section,
  s.id_socio,
  s.nombre_completo,
  s.activo,
  s.fecha_alta,
  up.pago_id,
  up.fecha_pago,
  up.fecha_vencimiento,
  up.monto_pagado,
  ua.ultima_asistencia,
  CASE
    WHEN up.pago_id IS NULL THEN 'SIN_PAGO'
    WHEN up.fecha_vencimiento < CURRENT_DATE THEN 'VENCIDA'
    WHEN up.fecha_vencimiento BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days' THEN 'POR_VENCER'
    ELSE 'AL_DIA'
  END AS estado_cuota,
  CASE
    WHEN up.fecha_vencimiento < CURRENT_DATE
     AND (ua.ultima_asistencia IS NULL OR ua.ultima_asistencia < up.fecha_vencimiento + INTERVAL '7 days')
    THEN true
    ELSE false
  END AS candidato_inactivacion_por_regla
FROM public.socio s
LEFT JOIN ultimos_pagos up ON up.socio_id = s.id_socio
LEFT JOIN ultima_asistencia ua ON ua.socio_id = s.id_socio
ORDER BY estado_cuota, s.nombre_completo;

-- 7) Pagos registrados con detalle de cuota y usuario registrador
SELECT
  'pagos_detalle' AS section,
  p.id,
  p.socio_id,
  s.nombre_completo AS socio,
  p.cuota_id,
  c.descripcion AS cuota,
  c.periodo AS cuota_periodo,
  c.monto AS cuota_monto,
  p.fecha_pago,
  p.fecha_vencimiento,
  p.monto_pagado,
  p.total,
  p.registrado_por,
  u.nombre AS registrado_por_nombre,
  p.enviar_email,
  p.creado_en
FROM public.pago p
LEFT JOIN public.socio s ON s.id_socio = p.socio_id
LEFT JOIN public.cuota c ON c.id = p.cuota_id
LEFT JOIN public.usuario u ON u.id = p.registrado_por
ORDER BY p.fecha_pago DESC NULLS LAST, p.creado_en DESC;

-- 8) Funciones/RPC relacionadas con cuota/pago/asistencia disponibles
SELECT
  'functions' AS section,
  n.nspname AS schema,
  p.proname AS function_name,
  pg_get_function_arguments(p.oid) AS arguments,
  pg_get_function_result(p.oid) AS result_type
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND (
    p.proname ILIKE '%cuota%'
    OR p.proname ILIKE '%pago%'
    OR p.proname ILIKE '%asistencia%'
    OR p.proname ILIKE '%moros%'
    OR p.proname ILIKE '%venc%'
    OR p.proname ILIKE '%retencion%'
  )
ORDER BY p.proname;

-- 9) Ejecución segura de RPC existentes si están disponibles
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'obtener_evolucion_cuota'
  ) THEN
    RAISE NOTICE 'RPC disponible: obtener_evolucion_cuota()';
  ELSE
    RAISE NOTICE 'RPC no disponible: obtener_evolucion_cuota()';
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'sp_analisis_conducta_pagos'
  ) THEN
    RAISE NOTICE 'RPC disponible: sp_analisis_conducta_pagos()';
  ELSE
    RAISE NOTICE 'RPC no disponible: sp_analisis_conducta_pagos()';
  END IF;
END $$;

SELECT 'obtener_evolucion_cuota' AS rpc, *
FROM public.obtener_evolucion_cuota()
ORDER BY anio, mes;

SELECT 'sp_analisis_conducta_pagos' AS rpc, *
FROM public.sp_analisis_conducta_pagos()
ORDER BY anio_mes, socio_id;
