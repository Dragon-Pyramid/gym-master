-- -----------------------------------------------------------------------------
-- Gym Master
-- Feature: catalogos-parametrizables-foundation
-- Migration: 202605222301_catalogos_parametrizables_seed.sql
--
-- Objetivo:
-- Cargar seed mínimo de catálogos parametrizables y backfill defensivo de
-- columnas FK opcionales creadas por la migración anterior.
-- -----------------------------------------------------------------------------

-- -----------------------------------------------------------------------------
-- 1. Seed tipo_empleado
-- -----------------------------------------------------------------------------
INSERT INTO public.tipo_empleado (codigo, nombre, descripcion, orden)
VALUES
  ('administrativo', 'Administrativo', 'Empleado administrativo del gimnasio.', 10),
  ('entrenador', 'Entrenador', 'Empleado responsable de entrenamiento, rutinas y seguimiento físico.', 20),
  ('mantenimiento', 'Mantenimiento de equipamientos', 'Empleado responsable de mantenimiento y control operativo de máquinas.', 30),
  ('limpieza', 'Limpieza', 'Empleado responsable de limpieza e higiene general.', 40),
  ('mayordomia_bar_snack', 'Mayordomía / bar-snack', 'Empleado responsable de cafetería, bebidas, snack bar o atención auxiliar.', 50)
ON CONFLICT (codigo) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  descripcion = EXCLUDED.descripcion,
  orden = EXCLUDED.orden,
  actualizado_en = now();

-- -----------------------------------------------------------------------------
-- 2. Seed medio_pago
-- -----------------------------------------------------------------------------
INSERT INTO public.medio_pago (codigo, nombre, descripcion, requiere_comprobante, es_online, orden)
VALUES
  ('efectivo', 'Efectivo', 'Pago manual registrado por administración.', false, false, 10),
  ('stripe', 'Stripe', 'Pago online procesado por Stripe.', true, true, 20),
  ('transferencia', 'Transferencia', 'Pago por transferencia bancaria o billetera.', true, false, 30),
  ('tarjeta_debito', 'Tarjeta de débito', 'Pago presencial con tarjeta de débito.', true, false, 40),
  ('tarjeta_credito', 'Tarjeta de crédito', 'Pago presencial con tarjeta de crédito.', true, false, 50),
  ('otro', 'Otro', 'Medio de pago no clasificado.', false, false, 90)
ON CONFLICT (codigo) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  descripcion = EXCLUDED.descripcion,
  requiere_comprobante = EXCLUDED.requiere_comprobante,
  es_online = EXCLUDED.es_online,
  orden = EXCLUDED.orden,
  actualizado_en = now();

-- -----------------------------------------------------------------------------
-- 3. Seed tipo_gasto
-- -----------------------------------------------------------------------------
INSERT INTO public.tipo_gasto (codigo, nombre, descripcion, orden)
VALUES
  ('sueldos', 'Sueldos', 'Pagos mensuales a empleados.', 10),
  ('mantenimiento', 'Mantenimiento', 'Gastos asociados a mantenimiento de equipamiento o infraestructura.', 20),
  ('servicios', 'Servicios', 'Luz, agua, internet, software u otros servicios.', 30),
  ('insumos', 'Insumos', 'Insumos operativos del gimnasio.', 40),
  ('alquiler', 'Alquiler', 'Alquiler del local o espacios asociados.', 50),
  ('impuestos', 'Impuestos', 'Impuestos, tasas y obligaciones fiscales.', 60),
  ('limpieza', 'Limpieza', 'Productos, personal o servicios de limpieza.', 70),
  ('marketing', 'Marketing', 'Publicidad, promociones y comunicación.', 80),
  ('otros', 'Otros', 'Gastos no clasificados.', 90)
ON CONFLICT (codigo) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  descripcion = EXCLUDED.descripcion,
  orden = EXCLUDED.orden,
  actualizado_en = now();

-- -----------------------------------------------------------------------------
-- 4. Seed tipo_ingreso
-- -----------------------------------------------------------------------------
INSERT INTO public.tipo_ingreso (codigo, nombre, descripcion, orden)
VALUES
  ('cuotas', 'Cuotas', 'Ingresos por pago de cuotas de socios.', 10),
  ('ventas', 'Ventas', 'Ingresos por venta de productos.', 20),
  ('servicios', 'Servicios', 'Ingresos por servicios adicionales.', 30),
  ('clases_especiales', 'Clases especiales', 'Ingresos por clases, eventos o actividades especiales.', 40),
  ('promociones', 'Promociones', 'Ingresos asociados a promociones o paquetes.', 50),
  ('otros', 'Otros', 'Ingresos no clasificados.', 90)
ON CONFLICT (codigo) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  descripcion = EXCLUDED.descripcion,
  orden = EXCLUDED.orden,
  actualizado_en = now();

-- -----------------------------------------------------------------------------
-- 5. Seed categoria_producto
-- -----------------------------------------------------------------------------
INSERT INTO public.categoria_producto (codigo, nombre, descripcion, orden)
VALUES
  ('bebidas', 'Bebidas', 'Agua, bebidas isotónicas, café u otras bebidas.', 10),
  ('snacks', 'Snacks', 'Snacks y alimentos rápidos.', 20),
  ('suplementos', 'Suplementos', 'Suplementos deportivos y nutricionales.', 30),
  ('indumentaria', 'Indumentaria', 'Ropa y accesorios de vestir.', 40),
  ('accesorios', 'Accesorios', 'Accesorios de entrenamiento o uso del gimnasio.', 50),
  ('higiene', 'Higiene', 'Productos de higiene o cuidado personal.', 60),
  ('otros', 'Otros', 'Productos no clasificados.', 90)
ON CONFLICT (codigo) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  descripcion = EXCLUDED.descripcion,
  orden = EXCLUDED.orden,
  actualizado_en = now();

-- -----------------------------------------------------------------------------
-- 6. Seed tipo_equipamiento
-- -----------------------------------------------------------------------------
INSERT INTO public.tipo_equipamiento (codigo, nombre, descripcion, orden)
VALUES
  ('cardio', 'Cardio', 'Equipamiento cardiovascular.', 10),
  ('fuerza', 'Fuerza', 'Máquinas y equipamiento de fuerza.', 20),
  ('funcional', 'Funcional', 'Equipamiento para entrenamiento funcional.', 30),
  ('peso_libre', 'Peso libre', 'Mancuernas, barras, discos y accesorios de peso libre.', 40),
  ('accesorio', 'Accesorio', 'Accesorios generales de entrenamiento.', 50),
  ('otro', 'Otro', 'Equipamiento no clasificado.', 90)
ON CONFLICT (codigo) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  descripcion = EXCLUDED.descripcion,
  orden = EXCLUDED.orden,
  actualizado_en = now();

-- -----------------------------------------------------------------------------
-- 7. Seed ubicacion_equipamiento
-- -----------------------------------------------------------------------------
INSERT INTO public.ubicacion_equipamiento (codigo, nombre, descripcion, orden)
VALUES
  ('zona_a', 'Zona A', 'Zona operativa A del gimnasio.', 10),
  ('zona_b', 'Zona B', 'Zona operativa B del gimnasio.', 20),
  ('zona_c', 'Zona C', 'Zona operativa C del gimnasio.', 30),
  ('zona_d', 'Zona D', 'Zona operativa D del gimnasio.', 40),
  ('sala_musculacion', 'Sala de musculación', 'Área principal de musculación.', 50),
  ('sala_cardio', 'Sala de cardio', 'Área de entrenamiento cardiovascular.', 60),
  ('deposito', 'Depósito', 'Espacio de almacenamiento.', 70),
  ('bar_snack', 'Bar / snack', 'Área de bar, snack o cafetería.', 80),
  ('recepcion', 'Recepción', 'Área de recepción y atención.', 90)
ON CONFLICT (codigo) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  descripcion = EXCLUDED.descripcion,
  orden = EXCLUDED.orden,
  actualizado_en = now();

-- -----------------------------------------------------------------------------
-- 8. Seed tipo_mantenimiento
-- -----------------------------------------------------------------------------
INSERT INTO public.tipo_mantenimiento (codigo, nombre, descripcion, frecuencia_dias, alerta_dias_anticipacion, orden)
VALUES
  ('preventivo', 'Preventivo', 'Mantenimiento preventivo general.', 30, 5, 10),
  ('correctivo', 'Correctivo', 'Mantenimiento correctivo por falla o rotura.', NULL, 0, 20),
  ('lubricacion', 'Lubricación', 'Verificación y lubricación de guías, poleas o partes móviles.', 30, 5, 30),
  ('cableado', 'Cableado / correas', 'Revisión de cables, correas, poleas y tensores.', 7, 5, 40),
  ('seguridad', 'Seguridad', 'Control de tornillos, seguros, estructura y estabilidad.', 15, 5, 50),
  ('limpieza', 'Limpieza técnica', 'Limpieza técnica del equipamiento.', 7, 3, 60),
  ('ajuste_calibracion', 'Ajuste / calibración', 'Ajuste de piezas, calibración o nivelación.', 30, 5, 70),
  ('revision_general', 'Revisión general', 'Revisión general no clasificada.', 30, 5, 90)
ON CONFLICT (codigo) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  descripcion = EXCLUDED.descripcion,
  frecuencia_dias = EXCLUDED.frecuencia_dias,
  alerta_dias_anticipacion = EXCLUDED.alerta_dias_anticipacion,
  orden = EXCLUDED.orden,
  actualizado_en = now();

-- -----------------------------------------------------------------------------
-- 9. Backfill defensivo de columnas FK opcionales
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  IF to_regclass('public.entrenadores') IS NOT NULL THEN
    UPDATE public.entrenadores e
       SET id_tipo_empleado = te.id
      FROM public.tipo_empleado te
     WHERE te.codigo = 'entrenador'
       AND e.id_tipo_empleado IS NULL;
  END IF;

  IF to_regclass('public.equipamiento') IS NOT NULL THEN
    UPDATE public.equipamiento e
       SET id_tipo_equipamiento = te.id
      FROM public.tipo_equipamiento te
     WHERE e.id_tipo_equipamiento IS NULL
       AND (
         lower(trim(e.tipo)) = lower(trim(te.nombre))
         OR lower(trim(e.tipo)) = lower(trim(te.codigo))
       );

    UPDATE public.equipamiento e
       SET id_ubicacion_equipamiento = ue.id
      FROM public.ubicacion_equipamiento ue
     WHERE e.id_ubicacion_equipamiento IS NULL
       AND (
         lower(trim(e.ubicacion)) = lower(trim(ue.nombre))
         OR lower(trim(e.ubicacion)) = lower(trim(ue.codigo))
       );
  END IF;

  IF to_regclass('public.mantenimiento') IS NOT NULL THEN
    UPDATE public.mantenimiento m
       SET id_tipo_mantenimiento = tm.id
      FROM public.tipo_mantenimiento tm
     WHERE m.id_tipo_mantenimiento IS NULL
       AND tm.codigo = CASE
         WHEN lower(coalesce(m.tipo_mantenimiento, '')) LIKE '%prevent%' THEN 'preventivo'
         WHEN lower(coalesce(m.tipo_mantenimiento, '')) LIKE '%correct%' THEN 'correctivo'
         WHEN lower(coalesce(m.tipo_mantenimiento, '')) LIKE '%lubric%' THEN 'lubricacion'
         WHEN lower(coalesce(m.tipo_mantenimiento, '')) LIKE '%cable%' THEN 'cableado'
         WHEN lower(coalesce(m.tipo_mantenimiento, '')) LIKE '%correa%' THEN 'cableado'
         WHEN lower(coalesce(m.tipo_mantenimiento, '')) LIKE '%segur%' THEN 'seguridad'
         WHEN lower(coalesce(m.tipo_mantenimiento, '')) LIKE '%limp%' THEN 'limpieza'
         WHEN lower(coalesce(m.tipo_mantenimiento, '')) LIKE '%calibr%' THEN 'ajuste_calibracion'
         WHEN lower(coalesce(m.tipo_mantenimiento, '')) LIKE '%ajust%' THEN 'ajuste_calibracion'
         ELSE 'revision_general'
       END;
  END IF;

  IF to_regclass('public.pago') IS NOT NULL THEN
    UPDATE public.pago p
       SET id_medio_pago = mp.id
      FROM public.medio_pago mp
     WHERE p.id_medio_pago IS NULL
       AND mp.codigo = CASE
         WHEN lower(coalesce(p.metodo_pago, '')) LIKE '%stripe%' THEN 'stripe'
         WHEN lower(coalesce(p.metodo_pago, '')) LIKE '%efect%' THEN 'efectivo'
         WHEN lower(coalesce(p.metodo_pago, '')) LIKE '%transfer%' THEN 'transferencia'
         WHEN lower(coalesce(p.metodo_pago, '')) LIKE '%debito%' THEN 'tarjeta_debito'
         WHEN lower(coalesce(p.metodo_pago, '')) LIKE '%débito%' THEN 'tarjeta_debito'
         WHEN lower(coalesce(p.metodo_pago, '')) LIKE '%credito%' THEN 'tarjeta_credito'
         WHEN lower(coalesce(p.metodo_pago, '')) LIKE '%crédito%' THEN 'tarjeta_credito'
         WHEN lower(coalesce(p.metodo_pago, '')) LIKE '%tarjeta%' THEN 'tarjeta_credito'
         ELSE 'otro'
       END;
  END IF;

  IF to_regclass('public.otros_gastos') IS NOT NULL THEN
    UPDATE public.otros_gastos g
       SET id_tipo_gasto = tg.id
      FROM public.tipo_gasto tg
     WHERE tg.codigo = 'otros'
       AND g.id_tipo_gasto IS NULL;
  END IF;
END $$;
