-- ============================================================
-- VALIDACIÓN - feature/rutinas-exercise-knowledge-base-seed
-- Seguro: solo lectura
-- ============================================================

-- 1) Columnas nuevas en ejercicio
WITH expected_columns(column_name) AS (
  VALUES
    ('nombre_en'),
    ('descripcion'),
    ('tipo_ejercicio'),
    ('patron_movimiento'),
    ('equipamiento'),
    ('dificultad'),
    ('orden_sugerido'),
    ('series_sugeridas'),
    ('repeticiones_sugeridas'),
    ('descanso_sugerido_seg'),
    ('rpe_sugerido'),
    ('intensidad'),
    ('video_youtube_url'),
    ('youtube_video_id'),
    ('imagen_origen'),
    ('cloudinary_public_id'),
    ('activo')
)
SELECT
  'column_ejercicio.' || e.column_name AS check_name,
  CASE WHEN c.column_name IS NOT NULL THEN 'OK' ELSE 'MISSING' END AS status
FROM expected_columns e
LEFT JOIN information_schema.columns c
  ON c.table_schema = 'public'
 AND c.table_name = 'ejercicio'
 AND c.column_name = e.column_name
ORDER BY e.column_name;

-- 2) Tablas nuevas/foundation
SELECT
  'table_rutina_generacion_regla' AS check_name,
  CASE WHEN to_regclass('public.rutina_generacion_regla') IS NOT NULL THEN 'OK' ELSE 'MISSING' END AS status
UNION ALL
SELECT
  'table_ejercicio_media' AS check_name,
  CASE WHEN to_regclass('public.ejercicio_media') IS NOT NULL THEN 'OK' ELSE 'MISSING' END AS status;

-- 3) Reglas por objetivo/nivel: esperado 10 objetivos x 3 niveles = 30
SELECT
  'reglas_objetivo_nivel' AS check_name,
  COUNT(*) AS total_reglas,
  CASE WHEN COUNT(*) >= 30 THEN 'OK' ELSE 'CHECK' END AS status
FROM public.rutina_generacion_regla
WHERE activo = true;

-- 4) Cantidad de ejercicios por objetivo/nivel
SELECT
  o.id_objetivo,
  o.nombre_objetivo,
  n.id_nivel,
  n.nombre_nivel,
  COUNT(e.id_ejercicio) AS total_ejercicios,
  CASE WHEN COUNT(e.id_ejercicio) >= 32 THEN 'OK' ELSE 'CHECK' END AS status
FROM public.objetivo o
CROSS JOIN public.nivel n
LEFT JOIN public.ejercicio e
  ON e.id_objetivo = o.id_objetivo
 AND e.id_nivel = n.id_nivel
 AND COALESCE(e.activo, true) = true
GROUP BY o.id_objetivo, o.nombre_objetivo, n.id_nivel, n.nombre_nivel
ORDER BY o.id_objetivo, n.id_nivel;

-- 5) Combos objetivo/nivel sin ejercicios suficientes
SELECT
  o.nombre_objetivo,
  n.nombre_nivel,
  COUNT(e.id_ejercicio) AS total_ejercicios
FROM public.objetivo o
CROSS JOIN public.nivel n
LEFT JOIN public.ejercicio e
  ON e.id_objetivo = o.id_objetivo
 AND e.id_nivel = n.id_nivel
 AND COALESCE(e.activo, true) = true
GROUP BY o.nombre_objetivo, n.nombre_nivel
HAVING COUNT(e.id_ejercicio) < 32
ORDER BY o.nombre_objetivo, n.nombre_nivel;

-- 6) Cobertura por grupo muscular para cada objetivo/nivel
SELECT
  o.nombre_objetivo,
  n.nombre_nivel,
  gm.nombre_gp,
  COUNT(e.id_ejercicio) AS total_ejercicios,
  CASE WHEN COUNT(e.id_ejercicio) >= 4 THEN 'OK' ELSE 'CHECK' END AS status
FROM public.objetivo o
CROSS JOIN public.nivel n
CROSS JOIN public.grupo_muscular gm
LEFT JOIN public.ejercicio e
  ON e.id_objetivo = o.id_objetivo
 AND e.id_nivel = n.id_nivel
 AND e.id_gm = gm.id_gm
 AND COALESCE(e.activo, true) = true
WHERE gm.id_gm BETWEEN 1 AND 8
GROUP BY o.nombre_objetivo, n.nombre_nivel, gm.nombre_gp, o.id_objetivo, n.id_nivel, gm.id_gm
ORDER BY o.id_objetivo, n.id_nivel, gm.id_gm;

-- 7) Función generadora actualizada
SELECT
  'function_generar_rutina_socio' AS check_name,
  CASE WHEN EXISTS (
    SELECT 1
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'generar_rutina_socio'
  ) THEN 'OK' ELSE 'MISSING' END AS status;

-- 8) Media principal creada
SELECT
  'ejercicio_media_rows' AS check_name,
  COUNT(*) AS total_media,
  CASE WHEN COUNT(*) > 0 THEN 'OK' ELSE 'CHECK' END AS status
FROM public.ejercicio_media
WHERE activo = true;

-- 9) Resumen final compacto
WITH checks AS (
  SELECT 'tabla_reglas' AS item, to_regclass('public.rutina_generacion_regla') IS NOT NULL AS ok
  UNION ALL SELECT 'tabla_media', to_regclass('public.ejercicio_media') IS NOT NULL
  UNION ALL SELECT 'reglas_30', (SELECT COUNT(*) >= 30 FROM public.rutina_generacion_regla WHERE activo = true)
  UNION ALL SELECT 'ejercicios_todos_objetivos', NOT EXISTS (
    SELECT 1
    FROM public.objetivo o
    CROSS JOIN public.nivel n
    LEFT JOIN public.ejercicio e
      ON e.id_objetivo = o.id_objetivo
     AND e.id_nivel = n.id_nivel
     AND COALESCE(e.activo, true) = true
    GROUP BY o.id_objetivo, n.id_nivel
    HAVING COUNT(e.id_ejercicio) < 32
  )
)
SELECT item, CASE WHEN ok THEN 'OK' ELSE 'CHECK' END AS status
FROM checks
ORDER BY item;
