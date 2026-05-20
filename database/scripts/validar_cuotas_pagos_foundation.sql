-- Validación de foundation cuotas/pagos/vencimientos.
-- Puede ejecutarse en Supabase local o remoto.
-- Usa transacción con ROLLBACK para no dejar datos de prueba.

SELECT '1. Evolución de cuota corregida' AS seccion;
SELECT * FROM public.obtener_evolucion_cuota() LIMIT 20;

SELECT '2. Columnas nuevas de pago' AS seccion;
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'pago'
  AND column_name IN (
    'periodo_desde',
    'periodo_hasta',
    'meses_cubiertos',
    'metodo_pago',
    'estado',
    'stripe_session_id',
    'stripe_payment_intent_id',
    'observaciones',
    'activo'
  )
ORDER BY column_name;

SELECT '3. Prueba transaccional de pago adelantado' AS seccion;
BEGIN;

INSERT INTO public.usuario (id, nombre, email, password_hash, rol, activo)
VALUES (
  '00000000-0000-4000-8000-000000000501',
  'Admin QA Pagos',
  'admin.qa.pagos@gymmaster.local',
  '$2a$10$dummyhashforlocalvalidationonly',
  'admin',
  true
)
ON CONFLICT (id) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  email = EXCLUDED.email,
  rol = EXCLUDED.rol,
  activo = EXCLUDED.activo;

INSERT INTO public.socio (id_socio, usuario_id, nombre_completo, dni, email, activo, fecha_alta)
VALUES (
  '00000000-0000-4000-8000-000000000502',
  '00000000-0000-4000-8000-000000000501',
  'Socio QA Pagos',
  'QA-PAGOS-001',
  'socio.qa.pagos@gymmaster.local',
  true,
  CURRENT_DATE
)
ON CONFLICT (id_socio) DO UPDATE SET
  nombre_completo = EXCLUDED.nombre_completo,
  activo = EXCLUDED.activo,
  email = EXCLUDED.email;

INSERT INTO public.cuota (id, descripcion, monto, periodo, fecha_inicio, fecha_fin, activo)
VALUES (
  '00000000-0000-4000-8000-000000000503',
  'Cuota QA Mensual',
  20500,
  TO_CHAR(CURRENT_DATE, 'YYYY-MM'),
  DATE_TRUNC('month', CURRENT_DATE)::date,
  (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month - 1 day')::date,
  true
)
ON CONFLICT (id) DO UPDATE SET
  monto = EXCLUDED.monto,
  periodo = EXCLUDED.periodo,
  fecha_inicio = EXCLUDED.fecha_inicio,
  fecha_fin = EXCLUDED.fecha_fin,
  activo = EXCLUDED.activo;

INSERT INTO public.pago (
  id,
  socio_id,
  cuota_id,
  fecha_pago,
  monto_pagado,
  total,
  registrado_por,
  fecha_vencimiento,
  periodo_desde,
  periodo_hasta,
  meses_cubiertos,
  metodo_pago,
  estado,
  observaciones,
  activo
)
VALUES (
  '00000000-0000-4000-8000-000000000504',
  '00000000-0000-4000-8000-000000000502',
  '00000000-0000-4000-8000-000000000503',
  CURRENT_DATE,
  41000,
  41000,
  '00000000-0000-4000-8000-000000000501',
  (CURRENT_DATE + INTERVAL '2 months')::date,
  CURRENT_DATE,
  (CURRENT_DATE + INTERVAL '2 months')::date,
  2,
  'efectivo',
  'pagado',
  'Pago QA de dos meses en efectivo',
  true
)
ON CONFLICT (id) DO UPDATE SET
  fecha_pago = EXCLUDED.fecha_pago,
  monto_pagado = EXCLUDED.monto_pagado,
  total = EXCLUDED.total,
  fecha_vencimiento = EXCLUDED.fecha_vencimiento,
  periodo_desde = EXCLUDED.periodo_desde,
  periodo_hasta = EXCLUDED.periodo_hasta,
  meses_cubiertos = EXCLUDED.meses_cubiertos,
  metodo_pago = EXCLUDED.metodo_pago,
  estado = EXCLUDED.estado,
  activo = EXCLUDED.activo;

SELECT '4. Estado de cuota del socio QA' AS seccion;
SELECT *
FROM public.obtener_estado_cuota_socio('00000000-0000-4000-8000-000000000502');

SELECT '5. Listado general de estados de cuota' AS seccion;
SELECT *
FROM public.obtener_socios_estado_cuota()
WHERE id_socio = '00000000-0000-4000-8000-000000000502';

ROLLBACK;
