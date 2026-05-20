-- =============================================================================
-- Gym Master
-- Migration: rutinas exercise images fallback
-- Fecha: 2026-05-20
-- Objetivo:
--   Completar un fallback visual para ejercicios sin imagen, especialmente los
--   ejercicios seed de niveles Inicial e Intermedio, para que el frontend pueda
--   mostrar el botón/ícono de visualización y el PDF no quede sin recurso visual.
--
-- Notas:
--   - No reemplaza imágenes existentes.
--   - No borra datos.
--   - Usa un asset local versionado en public/images/exercises/.
--   - Queda preparado para que una futura migración cargue imágenes reales por
--     ejercicio y reemplace este fallback progresivamente.
-- =============================================================================

DO $$
DECLARE
  v_updated integer := 0;
BEGIN
  IF to_regclass('public.ejercicio') IS NULL THEN
    RAISE NOTICE 'Tabla public.ejercicio no existe. Se omite actualización de fallback de imágenes.';
    RETURN;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'ejercicio'
      AND column_name = 'imagen'
  ) THEN
    RAISE NOTICE 'Columna public.ejercicio.imagen no existe. Se omite actualización de fallback de imágenes.';
    RETURN;
  END IF;

  UPDATE public.ejercicio AS e
  SET imagen = '/images/exercises/gym-master-exercise-fallback.svg'
  WHERE (e.imagen IS NULL OR btrim(e.imagen::text) = '')
    AND (
      e.id_nivel IN (1, 2)
      OR e.id_nivel IS NULL
    );

  GET DIAGNOSTICS v_updated = ROW_COUNT;

  RAISE NOTICE 'Fallback de imágenes aplicado a % ejercicios sin imagen.', v_updated;
END $$;
