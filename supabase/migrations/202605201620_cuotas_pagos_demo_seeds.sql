-- -----------------------------------------------------------------------------
-- Gym Master - Demo seeds for membership fees and payments
-- Migration: 202605201620_cuotas_pagos_demo_seeds.sql
-- Purpose:
--   Creates deterministic QA users, members, fee and payments to validate:
--   - member up to date
--   - member paid ahead
--   - expired member
--   - member without payments
--   - cash and simulated Stripe payments
-- Notes:
--   - Does NOT call crypt() or gen_salt(); password_hash is a fixed bcrypt string.
--   - Does NOT insert into public.asistencia; minimal local baselines may not include it.
--   - Does NOT insert/update pago.total because it may be a generated column.
-- -----------------------------------------------------------------------------

-- Common demo password reference: GymMaster2026!
-- This hash is only for QA/demo users and should not be used for production users.
WITH constants AS (
  SELECT
    '$2a$10$7zJ7Pj2x2zI2L4l8VfJj1uSvZHvHdzdDaTxLqE0vQ9TR5w3EyQcfK'::text AS demo_password_hash
)
INSERT INTO public.usuario (
  id,
  nombre,
  email,
  password_hash,
  rol,
  activo
)
SELECT *
FROM (
  SELECT '00000000-0000-4000-8000-000000000700'::uuid, 'QA Admin Pagos', 'qa.admin.pagos@gymmaster.local', demo_password_hash, 'admin', true FROM constants
  UNION ALL
  SELECT '00000000-0000-4000-8000-000000000701'::uuid, 'QA Socio Al Dia', 'qa.socio.aldia@gymmaster.local', demo_password_hash, 'socio', true FROM constants
  UNION ALL
  SELECT '00000000-0000-4000-8000-000000000702'::uuid, 'QA Socia Adelantada', 'qa.socia.adelantada@gymmaster.local', demo_password_hash, 'socio', true FROM constants
  UNION ALL
  SELECT '00000000-0000-4000-8000-000000000703'::uuid, 'QA Socio Vencido', 'qa.socio.vencido@gymmaster.local', demo_password_hash, 'socio', true FROM constants
  UNION ALL
  SELECT '00000000-0000-4000-8000-000000000704'::uuid, 'QA Socia Sin Pagos', 'qa.socia.sinpagos@gymmaster.local', demo_password_hash, 'socio', true FROM constants
) AS v(id, nombre, email, password_hash, rol, activo)
ON CONFLICT (id) DO UPDATE
SET
  nombre = EXCLUDED.nombre,
  email = EXCLUDED.email,
  password_hash = EXCLUDED.password_hash,
  rol = EXCLUDED.rol,
  activo = EXCLUDED.activo,
  actualizado_en = CURRENT_TIMESTAMP;

INSERT INTO public.socio (
  id_socio,
  usuario_id,
  nombre_completo,
  dni,
  direccion,
  telefono,
  activo,
  fecha_alta,
  email
)
VALUES
  (
    '00000000-0000-4000-8000-000000000801',
    '00000000-0000-4000-8000-000000000701',
    'QA Socio Al Dia',
    'QA-PAGOS-801',
    'Dirección QA 801',
    '3810000801',
    true,
    CURRENT_DATE - INTERVAL '90 days',
    'qa.socio.aldia@gymmaster.local'
  ),
  (
    '00000000-0000-4000-8000-000000000802',
    '00000000-0000-4000-8000-000000000702',
    'QA Socia Adelantada',
    'QA-PAGOS-802',
    'Dirección QA 802',
    '3810000802',
    true,
    CURRENT_DATE - INTERVAL '120 days',
    'qa.socia.adelantada@gymmaster.local'
  ),
  (
    '00000000-0000-4000-8000-000000000803',
    '00000000-0000-4000-8000-000000000703',
    'QA Socio Vencido',
    'QA-PAGOS-803',
    'Dirección QA 803',
    '3810000803',
    true,
    CURRENT_DATE - INTERVAL '180 days',
    'qa.socio.vencido@gymmaster.local'
  ),
  (
    '00000000-0000-4000-8000-000000000804',
    '00000000-0000-4000-8000-000000000704',
    'QA Socia Sin Pagos',
    'QA-PAGOS-804',
    'Dirección QA 804',
    '3810000804',
    true,
    CURRENT_DATE - INTERVAL '45 days',
    'qa.socia.sinpagos@gymmaster.local'
  )
ON CONFLICT (id_socio) DO UPDATE
SET
  usuario_id = EXCLUDED.usuario_id,
  nombre_completo = EXCLUDED.nombre_completo,
  dni = EXCLUDED.dni,
  direccion = EXCLUDED.direccion,
  telefono = EXCLUDED.telefono,
  activo = EXCLUDED.activo,
  fecha_alta = EXCLUDED.fecha_alta,
  email = EXCLUDED.email,
  actualizado_en = CURRENT_TIMESTAMP;

INSERT INTO public.cuota (
  id,
  descripcion,
  monto,
  periodo,
  fecha_inicio,
  fecha_fin,
  activo
)
VALUES (
  '00000000-0000-4000-8000-000000000900',
  'Cuota mensual QA pagos',
  20500.00,
  TO_CHAR(CURRENT_DATE, 'YYYY-MM'),
  DATE_TRUNC('month', CURRENT_DATE)::date,
  (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month - 1 day')::date,
  true
)
ON CONFLICT (id) DO UPDATE
SET
  descripcion = EXCLUDED.descripcion,
  monto = EXCLUDED.monto,
  periodo = EXCLUDED.periodo,
  fecha_inicio = EXCLUDED.fecha_inicio,
  fecha_fin = EXCLUDED.fecha_fin,
  activo = EXCLUDED.activo,
  actualizado_en = CURRENT_TIMESTAMP;

INSERT INTO public.pago (
  id,
  socio_id,
  cuota_id,
  fecha_pago,
  monto_pagado,
  registrado_por,
  fecha_vencimiento,
  enviar_email,
  periodo_desde,
  periodo_hasta,
  meses_cubiertos,
  metodo_pago,
  estado,
  stripe_session_id,
  stripe_payment_intent_id,
  observaciones,
  activo
)
VALUES
  (
    '00000000-0000-4000-8000-000000001001',
    '00000000-0000-4000-8000-000000000801',
    '00000000-0000-4000-8000-000000000900',
    CURRENT_DATE - INTERVAL '5 days',
    20500.00,
    '00000000-0000-4000-8000-000000000700',
    CURRENT_DATE + INTERVAL '25 days',
    false,
    CURRENT_DATE - INTERVAL '5 days',
    CURRENT_DATE + INTERVAL '25 days',
    1,
    'efectivo',
    'pagado',
    NULL,
    NULL,
    'Pago QA efectivo al día',
    true
  ),
  (
    '00000000-0000-4000-8000-000000001002',
    '00000000-0000-4000-8000-000000000802',
    '00000000-0000-4000-8000-000000000900',
    CURRENT_DATE,
    61500.00,
    '00000000-0000-4000-8000-000000000700',
    CURRENT_DATE + INTERVAL '3 months',
    false,
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '3 months',
    3,
    'stripe',
    'pagado',
    'cs_test_gymmaster_demo_000000001002',
    'pi_test_gymmaster_demo_000000001002',
    'Pago QA Stripe simulado adelantado por 3 meses',
    true
  ),
  (
    '00000000-0000-4000-8000-000000001003',
    '00000000-0000-4000-8000-000000000803',
    '00000000-0000-4000-8000-000000000900',
    CURRENT_DATE - INTERVAL '70 days',
    20500.00,
    '00000000-0000-4000-8000-000000000700',
    CURRENT_DATE - INTERVAL '40 days',
    false,
    CURRENT_DATE - INTERVAL '70 days',
    CURRENT_DATE - INTERVAL '40 days',
    1,
    'efectivo',
    'pagado',
    NULL,
    NULL,
    'Pago QA vencido para validar mora',
    true
  )
ON CONFLICT (id) DO UPDATE
SET
  socio_id = EXCLUDED.socio_id,
  cuota_id = EXCLUDED.cuota_id,
  fecha_pago = EXCLUDED.fecha_pago,
  monto_pagado = EXCLUDED.monto_pagado,
  registrado_por = EXCLUDED.registrado_por,
  fecha_vencimiento = EXCLUDED.fecha_vencimiento,
  enviar_email = EXCLUDED.enviar_email,
  periodo_desde = EXCLUDED.periodo_desde,
  periodo_hasta = EXCLUDED.periodo_hasta,
  meses_cubiertos = EXCLUDED.meses_cubiertos,
  metodo_pago = EXCLUDED.metodo_pago,
  estado = EXCLUDED.estado,
  stripe_session_id = EXCLUDED.stripe_session_id,
  stripe_payment_intent_id = EXCLUDED.stripe_payment_intent_id,
  observaciones = EXCLUDED.observaciones,
  activo = EXCLUDED.activo,
  actualizado_en = CURRENT_TIMESTAMP;
