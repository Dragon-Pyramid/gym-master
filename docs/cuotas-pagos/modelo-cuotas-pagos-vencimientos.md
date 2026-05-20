# Gym Master — Foundation de cuotas, pagos y vencimientos

## Objetivo

Esta etapa consolida la base técnica para que Gym Master pueda manejar pagos de cuota de forma más realista, tanto por efectivo desde administración como por Stripe.

La auditoría previa confirmó que el sistema ya tenía las tablas `cuota`, `pago`, `historial_precios_cuota`, `socio` y `asistencia`, pero el modelo de `pago` era insuficiente para representar pagos adelantados, varios meses cubiertos, método de pago, estado del pago y trazabilidad Stripe.

## Cambios principales

### 1. Corrección de `obtener_evolucion_cuota()`

La función fallaba por referencia ambigua a `monto`. La corrección califica las columnas con alias de tabla, especialmente `c.monto`.

### 2. Ampliación de `public.pago`

Se agregan campos para representar correctamente el estado operativo de una cuota pagada:

- `periodo_desde`
- `periodo_hasta`
- `meses_cubiertos`
- `metodo_pago`
- `estado`
- `stripe_session_id`
- `stripe_payment_intent_id`
- `observaciones`
- `activo`

### 3. Funciones de estado de cuota

Se agregan funciones base para futuras APIs y dashboard:

- `obtener_estado_cuota_socio(p_id_socio uuid)`
- `obtener_socios_estado_cuota()`

Estas funciones permiten consultar si un socio está `sin_pagos`, `vencido` o `al_dia`.

## Flujo de validación requerido

Todo cambio de base debe seguir el flujo acordado:

1. Crear migración formal en `supabase/migrations`.
2. Probar primero en Supabase local.
3. Ejecutar scripts de validación.
4. Aplicar en remoto con Supabase CLI.
5. Confirmar historial con `supabase migration list`.
6. Probar funcionalmente desde la app.

## Próximos pasos

Esta base habilita el desarrollo posterior de:

- `/api/cuota-estado`
- pago manual desde administración
- integración más robusta de Stripe/webhook
- dashboard de socios vencidos
- métricas BI de cuotas y pagos
- seeds demo de pagos y vencimientos
