-- -----------------------------------------------------------------------------
-- Gym Master
-- Feature: morosidad-reactivacion-auditoria
-- Migration: 202605260630_morosidad_reactivacion_auditoria.sql
--
-- Objetivo:
-- 1) Crear auditoría de cambios operativos de estado de socio por morosidad.
-- 2) Centralizar la desactivación por mora/sin pagos.
-- 3) Centralizar la reactivación automática cuando un pago regulariza la cuota.
-- 4) Dejar funciones reutilizables para login, asistencia, pagos manuales y Stripe.
-- -----------------------------------------------------------------------------

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;

CREATE TABLE IF NOT EXISTS public.socio_estado_auditoria (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  socio_id uuid NOT NULL REFERENCES public.socio(id_socio) ON DELETE CASCADE,
  usuario_id uuid REFERENCES public.usuario(id) ON DELETE SET NULL,
  pago_id uuid REFERENCES public.pago(id) ON DELETE SET NULL,
  accion character varying(60) NOT NULL,
  motivo character varying(120) NOT NULL,
  origen character varying(80) NOT NULL DEFAULT 'sistema',
  estado_cuota character varying(40),
  dias_vencido integer,
  periodo_hasta date,
  detalle jsonb NOT NULL DEFAULT '{}'::jsonb,
  creado_en timestamp without time zone NOT NULL DEFAULT now(),
  CONSTRAINT socio_estado_auditoria_accion_check CHECK (
    accion IN (
      'desactivacion_mora',
      'desactivacion_sin_pagos',
      'reactivacion_pago',
      'sin_cambio'
    )
  ),
  CONSTRAINT socio_estado_auditoria_motivo_check CHECK (length(trim(motivo)) > 0),
  CONSTRAINT socio_estado_auditoria_origen_check CHECK (length(trim(origen)) > 0)
);

ALTER TABLE public.socio_estado_auditoria ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.socio_estado_auditoria FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS socio_estado_auditoria_select_policy ON public.socio_estado_auditoria;
CREATE POLICY socio_estado_auditoria_select_policy
  ON public.socio_estado_auditoria
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS socio_estado_auditoria_insert_policy ON public.socio_estado_auditoria;
CREATE POLICY socio_estado_auditoria_insert_policy
  ON public.socio_estado_auditoria
  FOR INSERT
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_socio_estado_auditoria_socio_fecha
  ON public.socio_estado_auditoria (socio_id, creado_en DESC);

CREATE INDEX IF NOT EXISTS idx_socio_estado_auditoria_accion_fecha
  ON public.socio_estado_auditoria (accion, creado_en DESC);

CREATE INDEX IF NOT EXISTS idx_socio_estado_auditoria_pago
  ON public.socio_estado_auditoria (pago_id);

COMMENT ON TABLE public.socio_estado_auditoria IS
  'Auditoría operativa de desactivaciones/reactivaciones de socios por morosidad, sin pagos o regularización mediante pago.';

COMMENT ON COLUMN public.socio_estado_auditoria.origen IS
  'Origen del cambio: login, asistencia_qr, pago_manual, stripe_webhook, pago_update, pago_cancelado, scheduler o sistema.';

CREATE OR REPLACE FUNCTION public.registrar_auditoria_estado_socio(
  p_socio_id uuid,
  p_accion text,
  p_motivo text,
  p_origen text DEFAULT 'sistema',
  p_estado_cuota text DEFAULT NULL,
  p_dias_vencido integer DEFAULT NULL,
  p_periodo_hasta date DEFAULT NULL,
  p_pago_id uuid DEFAULT NULL,
  p_usuario_id uuid DEFAULT NULL,
  p_detalle jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_auditoria_id uuid;
BEGIN
  INSERT INTO public.socio_estado_auditoria (
    socio_id,
    usuario_id,
    pago_id,
    accion,
    motivo,
    origen,
    estado_cuota,
    dias_vencido,
    periodo_hasta,
    detalle
  ) VALUES (
    p_socio_id,
    p_usuario_id,
    p_pago_id,
    p_accion::character varying,
    p_motivo::character varying,
    COALESCE(NULLIF(trim(p_origen), ''), 'sistema')::character varying,
    p_estado_cuota::character varying,
    p_dias_vencido,
    p_periodo_hasta,
    COALESCE(p_detalle, '{}'::jsonb)
  )
  RETURNING id INTO v_auditoria_id;

  RETURN v_auditoria_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.desactivar_socio_por_morosidad(
  p_id_socio uuid,
  p_origen text DEFAULT 'sistema',
  p_usuario_id uuid DEFAULT NULL
)
RETURNS TABLE(
  desactivado boolean,
  motivo text,
  estado_cuota text,
  dias_vencido integer,
  periodo_hasta date
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_estado record;
  v_socio record;
  v_debe_desactivar boolean := false;
  v_motivo text := 'sin_cambio';
  v_accion text := 'sin_cambio';
  v_desactivado boolean := false;
BEGIN
  SELECT *
  INTO v_estado
  FROM public.obtener_estado_cuota_socio(p_id_socio)
  LIMIT 1;

  SELECT s.id_socio, s.activo
  INTO v_socio
  FROM public.socio s
  WHERE s.id_socio = p_id_socio;

  IF NOT FOUND THEN
    RETURN QUERY SELECT
      false,
      'socio_no_encontrado'::text,
      NULL::text,
      NULL::integer,
      NULL::date;
    RETURN;
  END IF;

  IF v_estado.estado_cuota = 'sin_pagos' THEN
    v_debe_desactivar := true;
    v_motivo := 'sin_pagos';
    v_accion := 'desactivacion_sin_pagos';
  ELSIF v_estado.estado_cuota = 'vencido' AND COALESCE(v_estado.dias_vencido, 0) > 7 THEN
    v_debe_desactivar := true;
    v_motivo := 'mora_mayor_7_dias';
    v_accion := 'desactivacion_mora';
  END IF;

  IF v_debe_desactivar AND COALESCE(v_socio.activo, true) = true THEN
    UPDATE public.socio
    SET
      activo = false,
      fecha_baja = CURRENT_DATE,
      actualizado_en = now()
    WHERE id_socio = p_id_socio;

    PERFORM public.registrar_auditoria_estado_socio(
      p_socio_id := p_id_socio,
      p_accion := v_accion,
      p_motivo := v_motivo,
      p_origen := p_origen,
      p_estado_cuota := v_estado.estado_cuota,
      p_dias_vencido := v_estado.dias_vencido,
      p_periodo_hasta := v_estado.periodo_hasta,
      p_usuario_id := p_usuario_id,
      p_detalle := jsonb_build_object(
        'regla', 'sin_pagos_o_vencido_mayor_7_dias',
        'tolerancia_dias', 7
      )
    );

    v_desactivado := true;
  END IF;

  RETURN QUERY SELECT
    v_desactivado,
    v_motivo,
    v_estado.estado_cuota::text,
    v_estado.dias_vencido::integer,
    v_estado.periodo_hasta::date;
END;
$$;

CREATE OR REPLACE FUNCTION public.reactivar_socio_por_pago(
  p_id_socio uuid,
  p_pago_id uuid DEFAULT NULL,
  p_origen text DEFAULT 'pago',
  p_usuario_id uuid DEFAULT NULL
)
RETURNS TABLE(
  reactivado boolean,
  motivo text,
  estado_cuota text,
  periodo_hasta date
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_estado record;
  v_socio record;
  v_reactivado boolean := false;
BEGIN
  SELECT *
  INTO v_estado
  FROM public.obtener_estado_cuota_socio(p_id_socio)
  LIMIT 1;

  SELECT s.id_socio, s.activo
  INTO v_socio
  FROM public.socio s
  WHERE s.id_socio = p_id_socio;

  IF NOT FOUND THEN
    RETURN QUERY SELECT
      false,
      'socio_no_encontrado'::text,
      NULL::text,
      NULL::date;
    RETURN;
  END IF;

  IF v_estado.estado_cuota = 'al_dia' AND COALESCE(v_socio.activo, false) = false THEN
    UPDATE public.socio
    SET
      activo = true,
      fecha_baja = NULL,
      actualizado_en = now()
    WHERE id_socio = p_id_socio;

    PERFORM public.registrar_auditoria_estado_socio(
      p_socio_id := p_id_socio,
      p_accion := 'reactivacion_pago',
      p_motivo := 'regularizacion_pago',
      p_origen := p_origen,
      p_estado_cuota := v_estado.estado_cuota,
      p_dias_vencido := v_estado.dias_vencido,
      p_periodo_hasta := v_estado.periodo_hasta,
      p_pago_id := p_pago_id,
      p_usuario_id := p_usuario_id,
      p_detalle := jsonb_build_object(
        'regla', 'reactivar_si_pago_deja_al_dia'
      )
    );

    v_reactivado := true;
  END IF;

  RETURN QUERY SELECT
    v_reactivado,
    CASE
      WHEN v_reactivado THEN 'regularizacion_pago'
      WHEN v_estado.estado_cuota = 'al_dia' THEN 'socio_ya_activo_o_sin_cambio'
      ELSE 'pago_no_regulariza_cuota'
    END::text,
    v_estado.estado_cuota::text,
    v_estado.periodo_hasta::date;
END;
$$;

CREATE OR REPLACE FUNCTION public.sincronizar_morosidad_socios(
  p_origen text DEFAULT 'scheduler'
)
RETURNS TABLE(
  id_socio uuid,
  desactivado boolean,
  motivo text,
  estado_cuota text,
  dias_vencido integer,
  periodo_hasta date
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_socio record;
  v_result record;
BEGIN
  FOR v_socio IN
    SELECT s.id_socio
    FROM public.socio s
  LOOP
    SELECT *
    INTO v_result
    FROM public.desactivar_socio_por_morosidad(v_socio.id_socio, p_origen, NULL)
    LIMIT 1;

    IF COALESCE(v_result.desactivado, false) = true THEN
      RETURN QUERY SELECT
        v_socio.id_socio,
        v_result.desactivado,
        v_result.motivo,
        v_result.estado_cuota,
        v_result.dias_vencido,
        v_result.periodo_hasta;
    END IF;
  END LOOP;
END;
$$;

GRANT EXECUTE ON FUNCTION public.registrar_auditoria_estado_socio(uuid, text, text, text, text, integer, date, uuid, uuid, jsonb)
  TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.desactivar_socio_por_morosidad(uuid, text, uuid)
  TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.reactivar_socio_por_pago(uuid, uuid, text, uuid)
  TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.sincronizar_morosidad_socios(text)
  TO anon, authenticated, service_role;

GRANT SELECT, INSERT ON public.socio_estado_auditoria TO service_role;
