-- ============================================================
-- VALIDACIÓN - feature/cuotas-descuentos-pago-adelantado
-- Seguro: solo lectura
-- ============================================================

SELECT
  'table_cuota_descuento_config' AS check_name,
  CASE WHEN to_regclass('public.cuota_descuento_config') IS NOT NULL THEN 'OK' ELSE 'MISSING' END AS status;

WITH expected_columns(column_name) AS (
  VALUES
    ('id'),
    ('codigo'),
    ('activo'),
    ('cuotas_minimas'),
    ('porcentaje'),
    ('descripcion'),
    ('creado_en'),
    ('actualizado_en')
)
SELECT
  'column_cuota_descuento_config.' || e.column_name AS check_name,
  CASE WHEN c.column_name IS NOT NULL THEN 'OK' ELSE 'MISSING' END AS status
FROM expected_columns e
LEFT JOIN information_schema.columns c
  ON c.table_schema = 'public'
 AND c.table_name = 'cuota_descuento_config'
 AND c.column_name = e.column_name
ORDER BY e.column_name;

WITH expected_pago_columns(column_name) AS (
  VALUES
    ('subtotal'),
    ('descuento_porcentaje'),
    ('descuento_monto'),
    ('descuento_motivo')
)
SELECT
  'column_pago.' || e.column_name AS check_name,
  CASE WHEN c.column_name IS NOT NULL THEN 'OK' ELSE 'MISSING' END AS status,
  COALESCE(c.data_type, '-') AS data_type
FROM expected_pago_columns e
LEFT JOIN information_schema.columns c
  ON c.table_schema = 'public'
 AND c.table_name = 'pago'
 AND c.column_name = e.column_name
ORDER BY e.column_name;

SELECT
  'config_pago_adelantado' AS check_name,
  CASE
    WHEN EXISTS (
      SELECT 1
      FROM public.cuota_descuento_config
      WHERE codigo = 'pago_adelantado'
    )
    THEN 'OK'
    ELSE 'MISSING'
  END AS status;

SELECT
  id,
  codigo,
  activo,
  cuotas_minimas,
  porcentaje,
  descripcion,
  actualizado_en
FROM public.cuota_descuento_config
WHERE codigo = 'pago_adelantado';

WITH checks AS (
  SELECT 'tabla_config' AS item,
         to_regclass('public.cuota_descuento_config') IS NOT NULL AS ok

  UNION ALL

  SELECT 'config_pago_adelantado',
         EXISTS (
           SELECT 1
           FROM public.cuota_descuento_config
           WHERE codigo = 'pago_adelantado'
         )

  UNION ALL

  SELECT 'pago_subtotal',
         EXISTS (
           SELECT 1
           FROM information_schema.columns
           WHERE table_schema = 'public'
             AND table_name = 'pago'
             AND column_name = 'subtotal'
         )

  UNION ALL

  SELECT 'pago_descuento_porcentaje',
         EXISTS (
           SELECT 1
           FROM information_schema.columns
           WHERE table_schema = 'public'
             AND table_name = 'pago'
             AND column_name = 'descuento_porcentaje'
         )

  UNION ALL

  SELECT 'pago_descuento_monto',
         EXISTS (
           SELECT 1
           FROM information_schema.columns
           WHERE table_schema = 'public'
             AND table_name = 'pago'
             AND column_name = 'descuento_monto'
         )
)
SELECT
  item,
  CASE WHEN ok THEN 'OK' ELSE 'MISSING' END AS status
FROM checks
ORDER BY item;
