-- ============================================================
-- Gym Master - Media de ejercicios / políticas RLS
-- Feature: feature/rutinas-exercise-media-catalog
-- ============================================================

ALTER TABLE public.ejercicio_media ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS dev_all_ejercicio_media ON public.ejercicio_media;
CREATE POLICY dev_all_ejercicio_media
  ON public.ejercicio_media
  USING (true)
  WITH CHECK (true);

COMMENT ON POLICY dev_all_ejercicio_media ON public.ejercicio_media IS
  'Política operativa para permitir administración de media de ejercicios desde API interna de Gym Master. La autorización de negocio se valida con JWT en Next.js.';
