\echo '1. Socios QA de evolución física creados'

SELECT
  s.id_socio,
  s.nombre_completo,
  s.email,
  s.activo,
  s.fecha_alta,
  s.nivel,
  s.objetivo,
  s.dias_por_semana,
  s.fecnac
FROM public.socio s
WHERE s.id_socio IN (
  '00000000-0000-4000-8000-000000000923',
  '00000000-0000-4000-8000-000000000924'
)
ORDER BY s.nombre_completo;

\echo '2. Resumen de registros de evolución por socio'

SELECT
  s.nombre_completo,
  COUNT(e.id) AS total_registros,
  COUNT(*) FILTER (WHERE e.es_registro_inicial IS TRUE) AS registros_iniciales,
  MIN(e.fecha) AS primera_fecha,
  MAX(e.fecha) AS ultima_fecha,
  MIN(e.peso) AS peso_minimo,
  MAX(e.peso) AS peso_maximo,
  MIN(e.porcentaje_grasa) AS grasa_minima,
  MAX(e.porcentaje_grasa) AS grasa_maxima,
  MIN(e.masa_muscular) AS masa_muscular_minima,
  MAX(e.masa_muscular) AS masa_muscular_maxima
FROM public.socio s
JOIN public.evolucion_socio e ON e.socio_id = s.id_socio
WHERE s.id_socio IN (
  '00000000-0000-4000-8000-000000000923',
  '00000000-0000-4000-8000-000000000924'
)
GROUP BY s.nombre_completo
ORDER BY s.nombre_completo;

\echo '3. Línea temporal completa de evolución física QA'

SELECT
  s.nombre_completo,
  e.fecha,
  e.peso,
  e.altura,
  e.imc,
  e.cintura,
  e.pecho,
  e.abdomen,
  e.cadera,
  e.porcentaje_grasa,
  e.masa_muscular,
  e.tipo_corporal,
  e.sexo_referencia,
  e.es_registro_inicial
FROM public.evolucion_socio e
JOIN public.socio s ON s.id_socio = e.socio_id
WHERE e.socio_id IN (
  '00000000-0000-4000-8000-000000000923',
  '00000000-0000-4000-8000-000000000924'
)
ORDER BY s.nombre_completo, e.fecha;

\echo '4. Comparación antes/después por socio'

WITH ranked AS (
  SELECT
    s.nombre_completo,
    e.fecha,
    e.peso,
    e.cintura,
    e.abdomen,
    e.porcentaje_grasa,
    e.masa_muscular,
    e.tipo_corporal,
    ROW_NUMBER() OVER (PARTITION BY e.socio_id ORDER BY e.fecha ASC) AS rn_first,
    ROW_NUMBER() OVER (PARTITION BY e.socio_id ORDER BY e.fecha DESC) AS rn_last
  FROM public.evolucion_socio e
  JOIN public.socio s ON s.id_socio = e.socio_id
  WHERE e.socio_id IN (
    '00000000-0000-4000-8000-000000000923',
    '00000000-0000-4000-8000-000000000924'
  )
), inicial AS (
  SELECT * FROM ranked WHERE rn_first = 1
), actual AS (
  SELECT * FROM ranked WHERE rn_last = 1
)
SELECT
  i.nombre_completo,
  i.fecha AS fecha_inicial,
  a.fecha AS fecha_actual,
  i.peso AS peso_inicial,
  a.peso AS peso_actual,
  ROUND((a.peso - i.peso)::numeric, 2) AS variacion_peso,
  i.cintura AS cintura_inicial,
  a.cintura AS cintura_actual,
  ROUND((a.cintura - i.cintura)::numeric, 2) AS variacion_cintura,
  i.porcentaje_grasa AS grasa_inicial,
  a.porcentaje_grasa AS grasa_actual,
  ROUND((a.porcentaje_grasa - i.porcentaje_grasa)::numeric, 2) AS variacion_grasa,
  i.masa_muscular AS masa_muscular_inicial,
  a.masa_muscular AS masa_muscular_actual,
  ROUND((a.masa_muscular - i.masa_muscular)::numeric, 2) AS variacion_masa_muscular,
  i.tipo_corporal AS tipo_inicial,
  a.tipo_corporal AS tipo_actual
FROM inicial i
JOIN actual a ON a.nombre_completo = i.nombre_completo
ORDER BY i.nombre_completo;

\echo '5. Validación de cantidad esperada'

SELECT
  COUNT(*) AS registros_qa,
  CASE WHEN COUNT(*) = 10 THEN 'OK' ELSE 'REVISAR' END AS estado
FROM public.evolucion_socio
WHERE socio_id IN (
  '00000000-0000-4000-8000-000000000923',
  '00000000-0000-4000-8000-000000000924'
);
