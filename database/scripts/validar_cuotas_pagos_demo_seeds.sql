\echo '1. QA socios creados'
SELECT
  id_socio,
  nombre_completo,
  email,
  activo,
  fecha_alta
FROM public.socio
WHERE id_socio IN (
  '00000000-0000-4000-8000-000000000801'::uuid,
  '00000000-0000-4000-8000-000000000802'::uuid,
  '00000000-0000-4000-8000-000000000803'::uuid,
  '00000000-0000-4000-8000-000000000804'::uuid
)
ORDER BY nombre_completo;

\echo '2. Pagos QA creados'
SELECT
  p.id,
  s.nombre_completo,
  p.fecha_pago,
  p.fecha_vencimiento,
  p.periodo_desde,
  p.periodo_hasta,
  p.meses_cubiertos,
  p.metodo_pago,
  p.estado,
  p.monto_pagado,
  p.total,
  p.stripe_session_id,
  p.activo
FROM public.pago p
JOIN public.socio s ON s.id_socio = p.socio_id
WHERE p.id IN (
  '00000000-0000-4000-8000-000000001001'::uuid,
  '00000000-0000-4000-8000-000000001002'::uuid,
  '00000000-0000-4000-8000-000000001003'::uuid
)
ORDER BY p.fecha_pago DESC;

\echo '3. Estado de cuota por socio QA'
SELECT *
FROM public.obtener_socios_estado_cuota()
WHERE id_socio IN (
  '00000000-0000-4000-8000-000000000801'::uuid,
  '00000000-0000-4000-8000-000000000802'::uuid,
  '00000000-0000-4000-8000-000000000803'::uuid,
  '00000000-0000-4000-8000-000000000804'::uuid
)
ORDER BY nombre_completo;

\echo '4. Resumen por estado de cuota'
SELECT
  estado_cuota,
  COUNT(*) AS cantidad_socios
FROM public.obtener_socios_estado_cuota()
WHERE id_socio IN (
  '00000000-0000-4000-8000-000000000801'::uuid,
  '00000000-0000-4000-8000-000000000802'::uuid,
  '00000000-0000-4000-8000-000000000803'::uuid,
  '00000000-0000-4000-8000-000000000804'::uuid
)
GROUP BY estado_cuota
ORDER BY estado_cuota;

\echo '5. Resumen por método de pago'
SELECT
  metodo_pago,
  COUNT(DISTINCT socio_id) AS cantidad_socios,
  SUM(monto_pagado) AS total_pagado
FROM public.pago
WHERE id IN (
  '00000000-0000-4000-8000-000000001001'::uuid,
  '00000000-0000-4000-8000-000000001002'::uuid,
  '00000000-0000-4000-8000-000000001003'::uuid
)
GROUP BY metodo_pago
ORDER BY metodo_pago;

\echo '6. Función Data Science de conducta de pagos - disponibilidad'
SELECT
  EXISTS (
    SELECT 1
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'sp_analisis_conducta_pagos'
  ) AS existe_sp_analisis_conducta_pagos;

\echo '7. Data Science conducta de pagos - QA si existe'
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'sp_analisis_conducta_pagos'
  ) THEN
    RAISE NOTICE 'sp_analisis_conducta_pagos existe. Ejecutar consulta específica en remoto si se requiere.';
  ELSE
    RAISE NOTICE 'sp_analisis_conducta_pagos no existe en este baseline local. Validación no bloqueante.';
  END IF;
END $$;
