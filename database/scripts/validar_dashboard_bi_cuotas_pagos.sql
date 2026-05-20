\echo '1. Estados de cuota disponibles'
SELECT *
FROM public.obtener_socios_estado_cuota()
ORDER BY estado_cuota, nombre_completo;

\echo '2. Resumen por estado de cuota'
SELECT
  estado_cuota,
  COUNT(*) AS cantidad_socios
FROM public.obtener_socios_estado_cuota()
GROUP BY estado_cuota
ORDER BY estado_cuota;

\echo '3. Resumen por método de pago'
SELECT
  metodo_pago,
  estado,
  COUNT(*) AS cantidad_pagos,
  SUM(monto_pagado) AS total_pagado
FROM public.pago
WHERE COALESCE(activo, true) = true
GROUP BY metodo_pago, estado
ORDER BY metodo_pago, estado;

\echo '4. Evolución de precio de cuota'
SELECT *
FROM public.obtener_evolucion_cuota()
ORDER BY anio, mes;

\echo '5. Pagos recientes'
SELECT
  p.id,
  s.nombre_completo,
  p.fecha_pago,
  p.periodo_desde,
  p.periodo_hasta,
  p.meses_cubiertos,
  p.metodo_pago,
  p.estado,
  p.monto_pagado
FROM public.pago p
JOIN public.socio s ON s.id_socio = p.socio_id
WHERE COALESCE(p.activo, true) = true
ORDER BY p.fecha_pago DESC
LIMIT 20;
