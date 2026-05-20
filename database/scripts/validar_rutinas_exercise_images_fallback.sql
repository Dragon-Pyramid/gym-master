-- =============================================================================
-- Validación: rutinas exercise images fallback
-- =============================================================================

\echo '1. Resumen de ejercicios por objetivo/nivel e imágenes'

SELECT
  id_objetivo,
  id_nivel,
  COUNT(*) AS total_ejercicios,
  COUNT(*) FILTER (
    WHERE imagen IS NOT NULL AND btrim(imagen::text) <> ''
  ) AS ejercicios_con_imagen,
  COUNT(*) FILTER (
    WHERE imagen = '/images/exercises/gym-master-exercise-fallback.svg'
  ) AS ejercicios_con_fallback,
  COUNT(*) FILTER (
    WHERE imagen IS NULL OR btrim(imagen::text) = ''
  ) AS ejercicios_sin_imagen
FROM public.ejercicio
GROUP BY id_objetivo, id_nivel
ORDER BY id_objetivo, id_nivel;

\echo '2. Muestra de ejercicios Inicial/Intermedio con fallback'

SELECT
  *
FROM public.ejercicio
WHERE id_objetivo = 1
  AND id_nivel IN (1, 2)
  AND imagen = '/images/exercises/gym-master-exercise-fallback.svg'
LIMIT 10;

\echo '3. Validación puntual: niveles Inicial e Intermedio sin imagen'

SELECT
  COUNT(*) AS inicial_intermedio_sin_imagen
FROM public.ejercicio
WHERE id_nivel IN (1, 2)
  AND (imagen IS NULL OR btrim(imagen::text) = '');
