-- -----------------------------------------------------------------------------
-- Gym Master
-- Feature: catalogos-parametrizables-foundation
-- Migration: 202605222300_catalogos_parametrizables_foundation.sql
--
-- Objetivo:
-- Crear la base de catálogos parametrizables para el sistema sin integrar todavía
-- todos los formularios del frontend.
--
-- Alcance:
-- - Crea tablas de catálogos base.
-- - Agrega columnas FK opcionales a tablas existentes cuando corresponda.
-- - No elimina columnas legacy de texto.
-- - No renombra entrenadores a empleados todavía.
-- - Mantiene compatibilidad hacia atrás.
-- -----------------------------------------------------------------------------

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- -----------------------------------------------------------------------------
-- 1. Función común para actualizado_en en catálogos
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_catalogo_actualizado_en()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.actualizado_en = now();
  RETURN NEW;
END;
$$;

-- -----------------------------------------------------------------------------
-- 2. Catálogos base
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tipo_empleado (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo varchar(80) NOT NULL UNIQUE,
  nombre varchar(120) NOT NULL,
  descripcion text NULL,
  activo boolean NOT NULL DEFAULT true,
  orden integer NOT NULL DEFAULT 0,
  creado_en timestamp without time zone NOT NULL DEFAULT now(),
  actualizado_en timestamp without time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.medio_pago (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo varchar(80) NOT NULL UNIQUE,
  nombre varchar(120) NOT NULL,
  descripcion text NULL,
  requiere_comprobante boolean NOT NULL DEFAULT false,
  es_online boolean NOT NULL DEFAULT false,
  activo boolean NOT NULL DEFAULT true,
  orden integer NOT NULL DEFAULT 0,
  creado_en timestamp without time zone NOT NULL DEFAULT now(),
  actualizado_en timestamp without time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.tipo_gasto (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo varchar(80) NOT NULL UNIQUE,
  nombre varchar(120) NOT NULL,
  descripcion text NULL,
  activo boolean NOT NULL DEFAULT true,
  orden integer NOT NULL DEFAULT 0,
  creado_en timestamp without time zone NOT NULL DEFAULT now(),
  actualizado_en timestamp without time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.tipo_ingreso (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo varchar(80) NOT NULL UNIQUE,
  nombre varchar(120) NOT NULL,
  descripcion text NULL,
  activo boolean NOT NULL DEFAULT true,
  orden integer NOT NULL DEFAULT 0,
  creado_en timestamp without time zone NOT NULL DEFAULT now(),
  actualizado_en timestamp without time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.categoria_producto (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo varchar(80) NOT NULL UNIQUE,
  nombre varchar(120) NOT NULL,
  descripcion text NULL,
  activo boolean NOT NULL DEFAULT true,
  orden integer NOT NULL DEFAULT 0,
  creado_en timestamp without time zone NOT NULL DEFAULT now(),
  actualizado_en timestamp without time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.tipo_equipamiento (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo varchar(80) NOT NULL UNIQUE,
  nombre varchar(120) NOT NULL,
  descripcion text NULL,
  activo boolean NOT NULL DEFAULT true,
  orden integer NOT NULL DEFAULT 0,
  creado_en timestamp without time zone NOT NULL DEFAULT now(),
  actualizado_en timestamp without time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ubicacion_equipamiento (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo varchar(80) NOT NULL UNIQUE,
  nombre varchar(120) NOT NULL,
  descripcion text NULL,
  activo boolean NOT NULL DEFAULT true,
  orden integer NOT NULL DEFAULT 0,
  creado_en timestamp without time zone NOT NULL DEFAULT now(),
  actualizado_en timestamp without time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.tipo_mantenimiento (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo varchar(80) NOT NULL UNIQUE,
  nombre varchar(120) NOT NULL,
  descripcion text NULL,
  frecuencia_dias integer NULL,
  alerta_dias_anticipacion integer NOT NULL DEFAULT 5,
  activo boolean NOT NULL DEFAULT true,
  orden integer NOT NULL DEFAULT 0,
  creado_en timestamp without time zone NOT NULL DEFAULT now(),
  actualizado_en timestamp without time zone NOT NULL DEFAULT now(),
  CONSTRAINT tipo_mantenimiento_frecuencia_check
    CHECK (frecuencia_dias IS NULL OR frecuencia_dias > 0),
  CONSTRAINT tipo_mantenimiento_alerta_check
    CHECK (alerta_dias_anticipacion >= 0)
);

-- -----------------------------------------------------------------------------
-- 3. Triggers de actualizado_en para catálogos
-- -----------------------------------------------------------------------------
DO $$
DECLARE
  catalog_table text;
  trigger_name text;
BEGIN
  FOREACH catalog_table IN ARRAY ARRAY[
    'tipo_empleado',
    'medio_pago',
    'tipo_gasto',
    'tipo_ingreso',
    'categoria_producto',
    'tipo_equipamiento',
    'ubicacion_equipamiento',
    'tipo_mantenimiento'
  ] LOOP
    trigger_name := 'trg_' || catalog_table || '_actualizado_en';

    IF NOT EXISTS (
      SELECT 1
      FROM pg_trigger
      WHERE tgname = trigger_name
        AND tgrelid = ('public.' || catalog_table)::regclass
    ) THEN
      EXECUTE format(
        'CREATE TRIGGER %I BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.set_catalogo_actualizado_en()',
        trigger_name,
        catalog_table
      );
    END IF;
  END LOOP;
END $$;

-- -----------------------------------------------------------------------------
-- 4. Columnas FK opcionales en tablas existentes
--    No reemplazan columnas legacy; preparan integración futura.
-- -----------------------------------------------------------------------------
ALTER TABLE IF EXISTS public.entrenadores
  ADD COLUMN IF NOT EXISTS id_tipo_empleado uuid NULL;

ALTER TABLE IF EXISTS public.producto
  ADD COLUMN IF NOT EXISTS id_categoria_producto uuid NULL;

ALTER TABLE IF EXISTS public.equipamiento
  ADD COLUMN IF NOT EXISTS id_tipo_equipamiento uuid NULL,
  ADD COLUMN IF NOT EXISTS id_ubicacion_equipamiento uuid NULL;

ALTER TABLE IF EXISTS public.mantenimiento
  ADD COLUMN IF NOT EXISTS id_tipo_mantenimiento uuid NULL;

ALTER TABLE IF EXISTS public.pago
  ADD COLUMN IF NOT EXISTS id_medio_pago uuid NULL;

ALTER TABLE IF EXISTS public.otros_gastos
  ADD COLUMN IF NOT EXISTS id_tipo_gasto uuid NULL;

-- -----------------------------------------------------------------------------
-- 5. Foreign keys defensivas
--    Importante: no usar 'tabla'::regclass sobre tablas opcionales inexistentes.
--    En baselines locales mínimos algunas tablas todavía no existen, por eso
--    se resuelve cada tabla con to_regclass() y se ejecuta DDL dinámico.
-- -----------------------------------------------------------------------------
DO $$
DECLARE
  target_table regclass;
BEGIN
  target_table := to_regclass('public.entrenadores');
  IF target_table IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM pg_constraint
       WHERE conname = 'entrenadores_id_tipo_empleado_fkey'
         AND conrelid = target_table
     ) THEN
    EXECUTE '
      ALTER TABLE public.entrenadores
      ADD CONSTRAINT entrenadores_id_tipo_empleado_fkey
      FOREIGN KEY (id_tipo_empleado)
      REFERENCES public.tipo_empleado(id)
      ON UPDATE CASCADE
      ON DELETE SET NULL';
  END IF;

  target_table := to_regclass('public.producto');
  IF target_table IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM pg_constraint
       WHERE conname = 'producto_id_categoria_producto_fkey'
         AND conrelid = target_table
     ) THEN
    EXECUTE '
      ALTER TABLE public.producto
      ADD CONSTRAINT producto_id_categoria_producto_fkey
      FOREIGN KEY (id_categoria_producto)
      REFERENCES public.categoria_producto(id)
      ON UPDATE CASCADE
      ON DELETE SET NULL';
  END IF;

  target_table := to_regclass('public.equipamiento');
  IF target_table IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM pg_constraint
       WHERE conname = 'equipamiento_id_tipo_equipamiento_fkey'
         AND conrelid = target_table
     ) THEN
    EXECUTE '
      ALTER TABLE public.equipamiento
      ADD CONSTRAINT equipamiento_id_tipo_equipamiento_fkey
      FOREIGN KEY (id_tipo_equipamiento)
      REFERENCES public.tipo_equipamiento(id)
      ON UPDATE CASCADE
      ON DELETE SET NULL';
  END IF;

  target_table := to_regclass('public.equipamiento');
  IF target_table IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM pg_constraint
       WHERE conname = 'equipamiento_id_ubicacion_equipamiento_fkey'
         AND conrelid = target_table
     ) THEN
    EXECUTE '
      ALTER TABLE public.equipamiento
      ADD CONSTRAINT equipamiento_id_ubicacion_equipamiento_fkey
      FOREIGN KEY (id_ubicacion_equipamiento)
      REFERENCES public.ubicacion_equipamiento(id)
      ON UPDATE CASCADE
      ON DELETE SET NULL';
  END IF;

  target_table := to_regclass('public.mantenimiento');
  IF target_table IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM pg_constraint
       WHERE conname = 'mantenimiento_id_tipo_mantenimiento_fkey'
         AND conrelid = target_table
     ) THEN
    EXECUTE '
      ALTER TABLE public.mantenimiento
      ADD CONSTRAINT mantenimiento_id_tipo_mantenimiento_fkey
      FOREIGN KEY (id_tipo_mantenimiento)
      REFERENCES public.tipo_mantenimiento(id)
      ON UPDATE CASCADE
      ON DELETE SET NULL';
  END IF;

  target_table := to_regclass('public.pago');
  IF target_table IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM pg_constraint
       WHERE conname = 'pago_id_medio_pago_fkey'
         AND conrelid = target_table
     ) THEN
    EXECUTE '
      ALTER TABLE public.pago
      ADD CONSTRAINT pago_id_medio_pago_fkey
      FOREIGN KEY (id_medio_pago)
      REFERENCES public.medio_pago(id)
      ON UPDATE CASCADE
      ON DELETE SET NULL';
  END IF;

  target_table := to_regclass('public.otros_gastos');
  IF target_table IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM pg_constraint
       WHERE conname = 'otros_gastos_id_tipo_gasto_fkey'
         AND conrelid = target_table
     ) THEN
    EXECUTE '
      ALTER TABLE public.otros_gastos
      ADD CONSTRAINT otros_gastos_id_tipo_gasto_fkey
      FOREIGN KEY (id_tipo_gasto)
      REFERENCES public.tipo_gasto(id)
      ON UPDATE CASCADE
      ON DELETE SET NULL';
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 6. Índices para integración futura
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  IF to_regclass('public.entrenadores') IS NOT NULL THEN
    CREATE INDEX IF NOT EXISTS idx_entrenadores_id_tipo_empleado
      ON public.entrenadores(id_tipo_empleado);
  END IF;

  IF to_regclass('public.producto') IS NOT NULL THEN
    CREATE INDEX IF NOT EXISTS idx_producto_id_categoria_producto
      ON public.producto(id_categoria_producto);
  END IF;

  IF to_regclass('public.equipamiento') IS NOT NULL THEN
    CREATE INDEX IF NOT EXISTS idx_equipamiento_id_tipo_equipamiento
      ON public.equipamiento(id_tipo_equipamiento);
    CREATE INDEX IF NOT EXISTS idx_equipamiento_id_ubicacion_equipamiento
      ON public.equipamiento(id_ubicacion_equipamiento);
  END IF;

  IF to_regclass('public.mantenimiento') IS NOT NULL THEN
    CREATE INDEX IF NOT EXISTS idx_mantenimiento_id_tipo_mantenimiento
      ON public.mantenimiento(id_tipo_mantenimiento);
  END IF;

  IF to_regclass('public.pago') IS NOT NULL THEN
    CREATE INDEX IF NOT EXISTS idx_pago_id_medio_pago
      ON public.pago(id_medio_pago);
  END IF;

  IF to_regclass('public.otros_gastos') IS NOT NULL THEN
    CREATE INDEX IF NOT EXISTS idx_otros_gastos_id_tipo_gasto
      ON public.otros_gastos(id_tipo_gasto);
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 7. Comentarios técnicos
-- -----------------------------------------------------------------------------
COMMENT ON TABLE public.tipo_empleado IS
  'Catálogo parametrizable de tipos de empleado. Base futura para migrar entrenadores hacia empleados, sueldos, recibos y reportes.';
COMMENT ON TABLE public.medio_pago IS
  'Catálogo parametrizable de medios de pago para cuotas, ventas, recibos y conciliación.';
COMMENT ON TABLE public.tipo_gasto IS
  'Catálogo parametrizable de egresos operativos: sueldos, mantenimiento, servicios, insumos, etc.';
COMMENT ON TABLE public.tipo_ingreso IS
  'Catálogo parametrizable de ingresos: cuotas, ventas, servicios, clases especiales, etc.';
COMMENT ON TABLE public.categoria_producto IS
  'Catálogo parametrizable de categorías para productos y ventas adicionales.';
COMMENT ON TABLE public.tipo_equipamiento IS
  'Catálogo parametrizable de tipos de equipamiento del gimnasio.';
COMMENT ON TABLE public.ubicacion_equipamiento IS
  'Catálogo parametrizable de ubicaciones físicas del equipamiento.';
COMMENT ON TABLE public.tipo_mantenimiento IS
  'Catálogo parametrizable de tipos de mantenimiento con frecuencia y alerta anticipada.';
