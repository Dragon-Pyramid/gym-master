# Informe ejecutivo — Foundation de cuotas, pagos y vencimientos

## Proyecto

Gym Master

## Rama

`feature/cuotas-pagos-foundation`

## Objetivo

Crear una base técnica robusta para manejar pagos de cuota, vencimientos, métodos de pago y futuras métricas comerciales del gimnasio.

## Contexto

Durante la auditoría de cuotas/pagos se detectó que el sistema tenía una estructura inicial, pero insuficiente para representar el comportamiento real de negocio. La tabla `pago` permitía registrar fecha, monto, cuota y socio, pero no permitía diferenciar con claridad pagos en efectivo, pagos por Stripe, pagos adelantados, varios meses cubiertos ni estado operativo del pago.

También se detectó un bug en la función `obtener_evolucion_cuota()`, que fallaba por referencia ambigua a la columna `monto`.

## Cambios técnicos

Se preparó una migración formal para:

- Corregir `obtener_evolucion_cuota()`.
- Ampliar `public.pago` con campos de período, método, estado y trazabilidad.
- Normalizar pagos existentes.
- Agregar constraints defensivos.
- Agregar índices para consultas de vencimiento y dashboard.
- Crear funciones para consultar el estado de cuota de un socio o de todos los socios.

## Valor para el negocio

Este cambio es la base para responder preguntas clave:

- Qué socios están al día.
- Qué socios tienen cuota vencida.
- Qué socios no pagaron nunca.
- Qué pagos fueron en efectivo.
- Qué pagos vinieron por Stripe.
- Cuántos meses cubre un pago.
- Cómo evoluciona la cuota en el tiempo.

## Validación

La validación debe ejecutarse primero en Supabase local con el script:

`database/scripts/validar_cuotas_pagos_foundation.sql`

Luego se debe aplicar a remoto con Supabase CLI, confirmando el historial con:

`npx supabase migration list`

## Próximos pasos

1. Implementar `/api/cuota-estado`.
2. Ajustar pago manual desde administrador.
3. Revisar Stripe y webhook.
4. Crear seeds demo para pagos.
5. Mostrar socios vencidos en dashboard.
6. Integrar métricas BI de cuotas/pagos.
