\echo '1. Columnas Stripe disponibles en public.pago'
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'pago'
  AND column_name IN (
    'metodo_pago',
    'estado',
    'periodo_desde',
    'periodo_hasta',
    'meses_cubiertos',
    'stripe_session_id',
    'stripe_payment_intent_id'
  )
ORDER BY column_name;

\echo '2. Pagos Stripe existentes o simulados'
SELECT
  p.id,
  s.nombre_completo,
  p.fecha_pago,
  p.periodo_desde,
  p.periodo_hasta,
  p.meses_cubiertos,
  p.metodo_pago,
  p.estado,
  p.monto_pagado,
  p.stripe_session_id,
  p.stripe_payment_intent_id,
  p.activo
FROM public.pago p
JOIN public.socio s ON s.id_socio = p.socio_id
WHERE p.metodo_pago = 'stripe'
ORDER BY p.fecha_pago DESC NULLS LAST;

\echo '3. Resumen por método de pago'
SELECT
  metodo_pago,
  estado,
  COUNT(*) AS cantidad,
  SUM(monto_pagado) AS total_pagado
FROM public.pago
GROUP BY metodo_pago, estado
ORDER BY metodo_pago, estado;
