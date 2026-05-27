-- ============================================================
-- VALIDACIÓN - rutinas exercise media equivalence sync
-- Solo lectura / No modifica datos
-- ============================================================

WITH base AS (
  SELECT
    e.id_ejercicio,
    e.nombre_ejercicio,
    o.nombre_objetivo,
    n.nombre_nivel,
    gm.nombre_gp,
    e.imagen,
    e.imagen_origen,
    e.cloudinary_public_id,
    e.video_youtube_url,
    e.youtube_video_id,
    e.activo
  FROM public.ejercicio e
  JOIN public.objetivo o ON o.id_objetivo = e.id_objetivo
  JOIN public.nivel n ON n.id_nivel = e.id_nivel
  JOIN public.grupo_muscular gm ON gm.id_gm = e.id_gm
  WHERE COALESCE(e.activo, true) = true
), source_pool AS (
  SELECT *
  FROM base
  WHERE nombre_objetivo = 'Volumen'
    AND nombre_nivel = 'Avanzado'
    AND imagen IS NOT NULL
    AND imagen NOT ILIKE '%fallback%'
    AND COALESCE(imagen_origen, '') <> 'fallback'
), targets AS (
  SELECT *
  FROM base
  WHERE (imagen IS NULL OR imagen ILIKE '%fallback%' OR COALESCE(imagen_origen, '') = 'fallback')
)
SELECT 'source_volumen_avanzado_con_media_real' AS check_name, COUNT(*) AS total, CASE WHEN COUNT(*) > 0 THEN 'OK' ELSE 'CHECK' END AS status FROM source_pool
UNION ALL
SELECT 'targets_con_fallback_o_vacio', COUNT(*), CASE WHEN COUNT(*) >= 0 THEN 'OK' ELSE 'CHECK' END FROM targets
UNION ALL
SELECT 'tabla_media', COUNT(*), CASE WHEN COUNT(*) > 0 THEN 'OK' ELSE 'CHECK' END FROM public.ejercicio_media WHERE COALESCE(activo, true) = true;
