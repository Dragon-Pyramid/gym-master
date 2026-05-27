-- ============================================================
-- VALIDACIÓN - feature/rutinas-exercise-media-catalog
-- Seguro: solo lectura
-- ============================================================

SELECT
  'table_ejercicio_media' AS check_name,
  CASE WHEN to_regclass('public.ejercicio_media') IS NOT NULL THEN 'OK' ELSE 'MISSING' END AS status;

WITH expected_columns(column_name) AS (
  VALUES
    ('imagen'),
    ('imagen_origen'),
    ('cloudinary_public_id'),
    ('video_youtube_url'),
    ('youtube_video_id'),
    ('media_actualizada_en'),
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

SELECT
  'ejercicios_total' AS check_name,
  COUNT(*) AS total,
  CASE WHEN COUNT(*) > 0 THEN 'OK' ELSE 'CHECK' END AS status
FROM public.ejercicio
WHERE COALESCE(activo, true) = true;

SELECT
  'rls_policy_ejercicio_media' AS check_name,
  CASE WHEN EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'ejercicio_media'
      AND policyname = 'dev_all_ejercicio_media'
  ) THEN 'OK' ELSE 'CHECK' END AS status;

SELECT
  'ejercicio_media_total' AS check_name,
  COUNT(*) AS total,
  CASE WHEN COUNT(*) > 0 THEN 'OK' ELSE 'CHECK' END AS status
FROM public.ejercicio_media
WHERE activo = true;

SELECT
  'ejercicios_cloudinary' AS check_name,
  COUNT(*) AS total
FROM public.ejercicio
WHERE COALESCE(activo, true) = true
  AND (imagen_origen = 'cloudinary' OR cloudinary_public_id IS NOT NULL);

SELECT
  'ejercicios_youtube' AS check_name,
  COUNT(*) AS total
FROM public.ejercicio
WHERE COALESCE(activo, true) = true
  AND video_youtube_url IS NOT NULL;

SELECT
  'ejercicios_fallback' AS check_name,
  COUNT(*) AS total
FROM public.ejercicio
WHERE COALESCE(activo, true) = true
  AND (imagen_origen = 'fallback' OR imagen ILIKE '%fallback%');

WITH checks AS (
  SELECT 'tabla_media' AS item,
         to_regclass('public.ejercicio_media') IS NOT NULL AS ok
  UNION ALL
  SELECT 'policy_ejercicio_media',
         EXISTS (
           SELECT 1
           FROM pg_policies
           WHERE schemaname = 'public'
             AND tablename = 'ejercicio_media'
             AND policyname = 'dev_all_ejercicio_media'
         )
  UNION ALL
  SELECT 'media_principal_activa',
         EXISTS (
           SELECT 1
           FROM public.ejercicio_media
           WHERE activo = true
             AND es_principal = true
         )
  UNION ALL
  SELECT 'columnas_media_ejercicio',
         NOT EXISTS (
           SELECT 1
           FROM (VALUES
             ('imagen_origen'),
             ('cloudinary_public_id'),
             ('video_youtube_url'),
             ('youtube_video_id'),
             ('media_actualizada_en')
           ) AS expected(column_name)
           LEFT JOIN information_schema.columns c
             ON c.table_schema = 'public'
            AND c.table_name = 'ejercicio'
            AND c.column_name = expected.column_name
           WHERE c.column_name IS NULL
         )
)
SELECT
  item,
  CASE WHEN ok THEN 'OK' ELSE 'CHECK' END AS status
FROM checks
ORDER BY item;
