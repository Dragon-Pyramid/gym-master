-- Validación de pagos manuales desde administrador.
-- Ejecutar después de registrar un pago manual desde la UI.

SELECT '1. Últimos pagos manuales activos' AS seccion;
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
  p.activo,
  u.nombre AS registrado_por
FROM public.pago p
JOIN public.socio s ON s.id_socio = p.socio_id
LEFT JOIN public.usuario u ON u.id = p.registrado_por
WHERE p.activo IS TRUE
ORDER BY p.creado_en DESC
LIMIT 10;

SELECT '2. Estado de cuota de socios con últimos pagos' AS seccion;
SELECT *
FROM public.obtener_socios_estado_cuota()
ORDER BY ultimo_pago DESC NULLS LAST, nombre_completo
LIMIT 20;

SELECT '3. Resumen por método y estado' AS seccion;
SELECT
  COALESCE(metodo_pago, 'sin_metodo') AS metodo_pago,
  COALESCE(estado, 'sin_estado') AS estado,
  COUNT(*) AS cantidad,
  SUM(monto_pagado) AS total_pagado
FROM public.pago
WHERE activo IS TRUE
GROUP BY metodo_pago, estado
ORDER BY metodo_pago, estado;
