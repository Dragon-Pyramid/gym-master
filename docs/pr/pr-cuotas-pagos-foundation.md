# PR — Foundation de cuotas, pagos y vencimientos

## Descripción

Este PR incorpora una primera base técnica para estabilizar la lógica de cuotas, pagos y vencimientos en Gym Master.

La rama parte de la auditoría previa del modelo actual, donde se detectó que la tabla `pago` no tenía campos suficientes para representar pagos adelantados, varios meses cubiertos, método de pago, estado del pago ni trazabilidad Stripe. También se detectó que la función `obtener_evolucion_cuota()` fallaba por una referencia ambigua a la columna `monto`.

## Cambios incluidos

- Se agrega migración formal en `supabase/migrations`.
- Se corrige `obtener_evolucion_cuota()` usando alias explícito sobre `public.cuota`.
- Se amplía `public.pago` con campos operativos para pagos reales:
  - `periodo_desde`
  - `periodo_hasta`
  - `meses_cubiertos`
  - `metodo_pago`
  - `estado`
  - `stripe_session_id`
  - `stripe_payment_intent_id`
  - `observaciones`
  - `activo`
- Se agregan constraints defensivos para método, estado, meses cubiertos y rango de período.
- Se agregan índices para consultas por socio, vencimiento, estado, método y Stripe.
- Se agregan funciones base:
  - `obtener_estado_cuota_socio(p_id_socio uuid)`
  - `obtener_socios_estado_cuota()`
- Se agrega script de validación SQL con prueba transaccional.
- Se documenta el modelo foundation para futuras etapas.

## Validaciones requeridas

Antes de aplicar a remoto:

```bash
npx supabase start -x storage-api -x imgproxy -x studio -x logflare
```

Luego ejecutar:

```bash
docker exec -i supabase_db_gym-master psql -U postgres -d postgres < database/scripts/validar_cuotas_pagos_foundation.sql
```

Después de validar localmente:

```bash
npx supabase db push
npx supabase migration list
```

## Alcance

Este PR no implementa todavía la UI final ni el endpoint `/api/cuota-estado`. Deja preparada la base de datos para desarrollar esos flujos en las próximas ramas.

## Pendientes posteriores

- Implementar `/api/cuota-estado`.
- Ajustar servicios de pago manual.
- Ajustar flujo de Stripe/webhook.
- Mostrar socios vencidos en dashboard.
- Crear seeds demo para pagos, vencimientos y formas de pago.
- Construir métricas BI de pagos/cuotas.
