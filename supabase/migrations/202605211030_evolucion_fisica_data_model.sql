-- -----------------------------------------------------------------------------
-- Gym Master
-- Feature: evolucion-fisica-data-model
-- Migration: 202605211030_evolucion_fisica_data_model.sql
--
-- Objetivo:
-- Crear/ampliar defensivamente public.evolucion_socio para soportar un modelo
-- profesional de evolución física: medidas corporales detalladas, tipo corporal,
-- sexo de referencia, fotos de progreso, registro inicial y base para silueta/PDF.
--
-- Notas:
-- - La base remota ya contiene evolucion_socio.
-- - El baseline local mínimo puede no contenerla, por eso esta migración primero
--   asegura la existencia de la tabla y luego agrega columnas faltantes.
-- - No elimina columnas legacy existentes: bicep, tricep, pierna, gluteos, etc.
-- - No fuerza socio_id NOT NULL si existen registros legacy sin socio.
-- -----------------------------------------------------------------------------

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- -----------------------------------------------------------------------------
-- 1. Baseline defensivo para entorno local mínimo
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.evolucion_socio (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  socio_id uuid NULL,
  fecha date NOT NULL,
  peso numeric NULL,
  cintura numeric NULL,
  bicep numeric NULL,
  tricep numeric NULL,
  pierna numeric NULL,
  gluteos numeric NULL,
  pantorrilla numeric NULL,
  altura numeric NULL,
  observaciones text NULL,
  created_at timestamp without time zone DEFAULT now(),
  imc numeric NULL
);

-- Agregar FK solo si no existe y si public.socio está disponible.
DO $$
BEGIN
  IF to_regclass('public.socio') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1
       FROM pg_constraint
       WHERE conname = 'evolucion_socio_socio_id_fkey'
         AND conrelid = 'public.evolucion_socio'::regclass
     ) THEN
    ALTER TABLE public.evolucion_socio
      ADD CONSTRAINT evolucion_socio_socio_id_fkey
      FOREIGN KEY (socio_id)
      REFERENCES public.socio(id_socio)
      ON DELETE CASCADE;
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 2. Ampliación del modelo de evolución física
-- -----------------------------------------------------------------------------
ALTER TABLE public.evolucion_socio
  ADD COLUMN IF NOT EXISTS pecho numeric,
  ADD COLUMN IF NOT EXISTS cadera numeric,
  ADD COLUMN IF NOT EXISTS abdomen numeric,
  ADD COLUMN IF NOT EXISTS cuello numeric,
  ADD COLUMN IF NOT EXISTS hombros numeric,
  ADD COLUMN IF NOT EXISTS antebrazo_izquierdo numeric,
  ADD COLUMN IF NOT EXISTS antebrazo_derecho numeric,
  ADD COLUMN IF NOT EXISTS biceps_izquierdo numeric,
  ADD COLUMN IF NOT EXISTS biceps_derecho numeric,
  ADD COLUMN IF NOT EXISTS triceps_izquierdo numeric,
  ADD COLUMN IF NOT EXISTS triceps_derecho numeric,
  ADD COLUMN IF NOT EXISTS muslo_izquierdo numeric,
  ADD COLUMN IF NOT EXISTS muslo_derecho numeric,
  ADD COLUMN IF NOT EXISTS pantorrilla_izquierda numeric,
  ADD COLUMN IF NOT EXISTS pantorrilla_derecha numeric,
  ADD COLUMN IF NOT EXISTS porcentaje_grasa numeric,
  ADD COLUMN IF NOT EXISTS masa_muscular numeric,
  ADD COLUMN IF NOT EXISTS tipo_corporal varchar(30),
  ADD COLUMN IF NOT EXISTS sexo_referencia varchar(30),
  ADD COLUMN IF NOT EXISTS foto_frontal_url text,
  ADD COLUMN IF NOT EXISTS foto_lateral_url text,
  ADD COLUMN IF NOT EXISTS foto_espalda_url text,
  ADD COLUMN IF NOT EXISTS origen_registro varchar(30) DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS es_registro_inicial boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS actualizado_en timestamp without time zone DEFAULT now();

-- -----------------------------------------------------------------------------
-- 3. Constraints defensivos
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'evolucion_socio_tipo_corporal_check'
      AND conrelid = 'public.evolucion_socio'::regclass
  ) THEN
    ALTER TABLE public.evolucion_socio
      ADD CONSTRAINT evolucion_socio_tipo_corporal_check
      CHECK (
        tipo_corporal IS NULL OR tipo_corporal IN ('ectomorfo', 'mesomorfo', 'endomorfo', 'mixto')
      ) NOT VALID;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'evolucion_socio_sexo_referencia_check'
      AND conrelid = 'public.evolucion_socio'::regclass
  ) THEN
    ALTER TABLE public.evolucion_socio
      ADD CONSTRAINT evolucion_socio_sexo_referencia_check
      CHECK (
        sexo_referencia IS NULL OR sexo_referencia IN ('masculino', 'femenino', 'otro', 'no_especificado')
      ) NOT VALID;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'evolucion_socio_origen_registro_check'
      AND conrelid = 'public.evolucion_socio'::regclass
  ) THEN
    ALTER TABLE public.evolucion_socio
      ADD CONSTRAINT evolucion_socio_origen_registro_check
      CHECK (
        origen_registro IS NULL OR origen_registro IN ('manual', 'socio', 'admin', 'sistema', 'importado')
      ) NOT VALID;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'evolucion_socio_medidas_no_negativas_check'
      AND conrelid = 'public.evolucion_socio'::regclass
  ) THEN
    ALTER TABLE public.evolucion_socio
      ADD CONSTRAINT evolucion_socio_medidas_no_negativas_check
      CHECK (
        (peso IS NULL OR peso >= 0) AND
        (altura IS NULL OR altura >= 0) AND
        (imc IS NULL OR imc >= 0) AND
        (cintura IS NULL OR cintura >= 0) AND
        (bicep IS NULL OR bicep >= 0) AND
        (tricep IS NULL OR tricep >= 0) AND
        (pierna IS NULL OR pierna >= 0) AND
        (gluteos IS NULL OR gluteos >= 0) AND
        (pantorrilla IS NULL OR pantorrilla >= 0) AND
        (pecho IS NULL OR pecho >= 0) AND
        (cadera IS NULL OR cadera >= 0) AND
        (abdomen IS NULL OR abdomen >= 0) AND
        (cuello IS NULL OR cuello >= 0) AND
        (hombros IS NULL OR hombros >= 0) AND
        (antebrazo_izquierdo IS NULL OR antebrazo_izquierdo >= 0) AND
        (antebrazo_derecho IS NULL OR antebrazo_derecho >= 0) AND
        (biceps_izquierdo IS NULL OR biceps_izquierdo >= 0) AND
        (biceps_derecho IS NULL OR biceps_derecho >= 0) AND
        (triceps_izquierdo IS NULL OR triceps_izquierdo >= 0) AND
        (triceps_derecho IS NULL OR triceps_derecho >= 0) AND
        (muslo_izquierdo IS NULL OR muslo_izquierdo >= 0) AND
        (muslo_derecho IS NULL OR muslo_derecho >= 0) AND
        (pantorrilla_izquierda IS NULL OR pantorrilla_izquierda >= 0) AND
        (pantorrilla_derecha IS NULL OR pantorrilla_derecha >= 0) AND
        (porcentaje_grasa IS NULL OR porcentaje_grasa >= 0) AND
        (masa_muscular IS NULL OR masa_muscular >= 0)
      ) NOT VALID;
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 4. Índices para consultas por socio/fecha e histórico
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_evolucion_socio_socio_fecha_desc
  ON public.evolucion_socio (socio_id, fecha DESC);

CREATE INDEX IF NOT EXISTS idx_evolucion_socio_fecha
  ON public.evolucion_socio (fecha);

CREATE INDEX IF NOT EXISTS idx_evolucion_socio_registro_inicial
  ON public.evolucion_socio (socio_id, es_registro_inicial)
  WHERE es_registro_inicial IS TRUE;

-- -----------------------------------------------------------------------------
-- 5. Trigger actualizado_en
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_evolucion_socio_actualizado_en()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.actualizado_en = now();
  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'trg_evolucion_socio_actualizado_en'
      AND tgrelid = 'public.evolucion_socio'::regclass
  ) THEN
    CREATE TRIGGER trg_evolucion_socio_actualizado_en
    BEFORE UPDATE ON public.evolucion_socio
    FOR EACH ROW
    EXECUTE FUNCTION public.set_evolucion_socio_actualizado_en();
  END IF;
END $$;

COMMENT ON TABLE public.evolucion_socio IS
  'Historial de evolución física del socio. Modelo ampliado para medidas corporales, comparación antes/después, silueta dinámica y PDF.';
