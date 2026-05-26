-- -----------------------------------------------------------------------------
-- Gym Master
-- Validación: feature/morosidad-reactivacion-auditoria
-- Ejecutar luego de aplicar la migración en Supabase local.
-- -----------------------------------------------------------------------------

BEGIN;

DO $$
BEGIN
  IF to_regclass('public.socio_estado_auditoria') IS NULL THEN
    RAISE EXCEPTION 'Falta tabla public.socio_estado_auditoria';
  END IF;

  IF to_regprocedure('public.desactivar_socio_por_morosidad(uuid,text,uuid)') IS NULL THEN
    RAISE EXCEPTION 'Falta función public.desactivar_socio_por_morosidad(uuid,text,uuid)';
  END IF;

  IF to_regprocedure('public.reactivar_socio_por_pago(uuid,uuid,text,uuid)') IS NULL THEN
    RAISE EXCEPTION 'Falta función public.reactivar_socio_por_pago(uuid,uuid,text,uuid)';
  END IF;

  IF to_regprocedure('public.sincronizar_morosidad_socios(text)') IS NULL THEN
    RAISE EXCEPTION 'Falta función public.sincronizar_morosidad_socios(text)';
  END IF;
END $$;

DO $$
DECLARE
  v_usuario uuid := '00000000-0000-4000-8000-000000009901';
  v_socio uuid := '00000000-0000-4000-8000-000000009902';
  v_cuota uuid := '00000000-0000-4000-8000-000000009903';
  v_pago uuid;
  v_result record;
  v_activo boolean;
  v_auditorias integer;
BEGIN
  INSERT INTO public.usuario (id, nombre, email, password_hash, rol, activo)
  VALUES (
    v_usuario,
    'QA Morosidad Auditoría',
    'qa.morosidad.auditoria@gymmaster.local',
    '$2a$10$abcdefghijklmnopqrstuuuuuuuuuuuuuuuuuuuuuuuuuuuuuu',
    'socio',
    true
  );

  INSERT INTO public.socio (
    id_socio,
    usuario_id,
    nombre_completo,
    dni,
    email,
    activo,
    fecha_alta,
    fecha_baja
  ) VALUES (
    v_socio,
    v_usuario,
    'QA Socio Morosidad Auditoría',
    'QA-MOROSIDAD-9902',
    'qa.morosidad.auditoria@gymmaster.local',
    true,
    CURRENT_DATE - 60,
    NULL
  );

  SELECT *
  INTO v_result
  FROM public.desactivar_socio_por_morosidad(v_socio, 'validacion_sin_pagos', NULL)
  LIMIT 1;

  IF COALESCE(v_result.desactivado, false) IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'La función no desactivó al socio sin pagos como se esperaba. Resultado: %', v_result;
  END IF;

  SELECT activo INTO v_activo FROM public.socio WHERE id_socio = v_socio;
  IF v_activo IS DISTINCT FROM false THEN
    RAISE EXCEPTION 'El socio debería estar inactivo luego de desactivación por sin pagos';
  END IF;

  INSERT INTO public.cuota (id, descripcion, monto, periodo, fecha_inicio, fecha_fin, activo)
  VALUES (
    v_cuota,
    'QA Cuota Morosidad Auditoría',
    10000,
    'mensual',
    CURRENT_DATE - 10,
    CURRENT_DATE + 40,
    true
  );

  INSERT INTO public.pago (
    socio_id,
    cuota_id,
    fecha_pago,
    fecha_vencimiento,
    periodo_desde,
    periodo_hasta,
    meses_cubiertos,
    monto_pagado,
    metodo_pago,
    estado,
    activo
  ) VALUES (
    v_socio,
    v_cuota,
    CURRENT_DATE,
    CURRENT_DATE + 30,
    CURRENT_DATE,
    CURRENT_DATE + 30,
    1,
    10000,
    'efectivo',
    'pagado',
    true
  ) RETURNING id INTO v_pago;

  SELECT *
  INTO v_result
  FROM public.reactivar_socio_por_pago(v_socio, v_pago, 'validacion_pago', NULL)
  LIMIT 1;

  IF COALESCE(v_result.reactivado, false) IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'La función no reactivó al socio regularizado. Resultado: %', v_result;
  END IF;

  SELECT activo INTO v_activo FROM public.socio WHERE id_socio = v_socio;
  IF v_activo IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'El socio debería estar activo luego de reactivación por pago';
  END IF;

  UPDATE public.pago
  SET activo = false, estado = 'cancelado'
  WHERE id = v_pago;

  SELECT *
  INTO v_result
  FROM public.desactivar_socio_por_morosidad(v_socio, 'validacion_pago_cancelado', NULL)
  LIMIT 1;

  IF COALESCE(v_result.desactivado, false) IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'La función no desactivó al socio luego de cancelar el único pago. Resultado: %', v_result;
  END IF;

  SELECT count(*)
  INTO v_auditorias
  FROM public.socio_estado_auditoria
  WHERE socio_id = v_socio;

  IF v_auditorias < 3 THEN
    RAISE EXCEPTION 'Se esperaban al menos 3 eventos de auditoría, encontrados: %', v_auditorias;
  END IF;
END $$;

ROLLBACK;

SELECT 'OK morosidad_reactivacion_auditoria' AS resultado;
