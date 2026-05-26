-- -----------------------------------------------------------------------------
-- Gym Master
-- Feature: cuotas-descuentos-pago-adelantado
-- Migration: 202605261130_cuotas_descuentos_pago_adelantado.sql
--
-- Objetivo:
-- 1) Parametrizar descuentos por pago adelantado de cuotas.
-- 2) Guardar snapshot de subtotal/descuento/total operativo en cada pago.
-- 3) Aplicar la regla tanto a pagos manuales como a Stripe.
-- -----------------------------------------------------------------------------

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;

CREATE TABLE IF NOT EXISTS public.cuota_descuento_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo character varying(80) NOT NULL UNIQUE,
  activo boolean NOT NULL DEFAULT false,
  cuotas_minimas integer NOT NULL DEFAULT 2,
  porcentaje numeric(5,2) NOT NULL DEFAULT 0,
  descripcion text,
  creado_en timestamp without time zone NOT NULL DEFAULT now(),
  actualizado_en timestamp without time zone NOT NULL DEFAULT now(),
  CONSTRAINT cuota_descuento_config_cuotas_minimas_chk CHECK (cuotas_minimas >= 1 AND cuotas_minimas <= 24),
  CONSTRAINT cuota_descuento_config_porcentaje_chk CHECK (porcentaje >= 0 AND porcentaje <= 100),
  CONSTRAINT cuota_descuento_config_codigo_chk CHECK (length(trim(codigo)) > 0)
);

ALTER TABLE public.cuota_descuento_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cuota_descuento_config FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS cuota_descuento_config_select_policy ON public.cuota_descuento_config;
CREATE POLICY cuota_descuento_config_select_policy
  ON public.cuota_descuento_config
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS cuota_descuento_config_insert_policy ON public.cuota_descuento_config;
CREATE POLICY cuota_descuento_config_insert_policy
  ON public.cuota_descuento_config
  FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS cuota_descuento_config_update_policy ON public.cuota_descuento_config;
CREATE POLICY cuota_descuento_config_update_policy
  ON public.cuota_descuento_config
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

INSERT INTO public.cuota_descuento_config (
  codigo,
  activo,
  cuotas_minimas,
  porcentaje,
  descripcion
)
VALUES (
  'pago_adelantado',
  false,
  2,
  0,
  'Descuento configurable para socios que pagan cuotas por adelantado.'
)
ON CONFLICT (codigo) DO NOTHING;

ALTER TABLE public.pago
  ADD COLUMN IF NOT EXISTS subtotal numeric(10,2),
  ADD COLUMN IF NOT EXISTS descuento_porcentaje numeric(5,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS descuento_monto numeric(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS descuento_motivo text;

ALTER TABLE public.pago
  DROP CONSTRAINT IF EXISTS pago_descuento_porcentaje_chk,
  ADD CONSTRAINT pago_descuento_porcentaje_chk CHECK (
    descuento_porcentaje >= 0 AND descuento_porcentaje <= 100
  );

ALTER TABLE public.pago
  DROP CONSTRAINT IF EXISTS pago_descuento_monto_chk,
  ADD CONSTRAINT pago_descuento_monto_chk CHECK (
    descuento_monto >= 0
  );

UPDATE public.pago
SET
  subtotal = COALESCE(subtotal, monto_pagado),
  descuento_porcentaje = COALESCE(descuento_porcentaje, 0),
  descuento_monto = COALESCE(descuento_monto, 0)
WHERE subtotal IS NULL
   OR descuento_porcentaje IS NULL
   OR descuento_monto IS NULL;

COMMENT ON TABLE public.cuota_descuento_config IS
  'Configuración administrativa de descuentos por pago adelantado de cuotas.';

COMMENT ON COLUMN public.cuota_descuento_config.cuotas_minimas IS
  'Cantidad mínima de cuotas/meses pagados para habilitar el descuento.';

COMMENT ON COLUMN public.cuota_descuento_config.porcentaje IS
  'Porcentaje de descuento aplicado sobre el subtotal cuando se cumple la cantidad mínima.';

COMMENT ON COLUMN public.pago.subtotal IS
  'Subtotal de cuotas antes de aplicar descuentos por pago adelantado.';

COMMENT ON COLUMN public.pago.descuento_porcentaje IS
  'Porcentaje de descuento aplicado al pago como snapshot operativo.';

COMMENT ON COLUMN public.pago.descuento_monto IS
  'Monto descontado al pago como snapshot operativo.';

COMMENT ON COLUMN public.pago.descuento_motivo IS
  'Motivo/mensaje del descuento aplicado al pago.';
