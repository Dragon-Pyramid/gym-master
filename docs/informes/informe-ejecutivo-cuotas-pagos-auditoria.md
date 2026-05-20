# Informe ejecutivo — Auditoría inicial de cuotas, pagos y vencimientos

## Proyecto

Gym Master

## Rama

`feature/cuotas-pagos-vencimientos`

## Objetivo del bloque

Iniciar la revisión técnica del módulo de cuotas, pagos y vencimientos antes de implementar cambios funcionales o migraciones de base de datos.

## Contexto

El módulo de cuotas y pagos es crítico para la operación del gimnasio. Debe permitir registrar pagos en efectivo desde administración, pagos online por Stripe, pagos adelantados, pagos que cubren varios meses y vencimientos de socios. Además, debe alimentar métricas de negocio como ingresos mensuales, morosidad, socios activos e historial de precios de cuota.

## Estado actual detectado

El sistema ya cuenta con tablas relacionadas con cuota, pago, socios, asistencia e historial de precios. También existen funciones de análisis como `obtener_evolucion_cuota()` y `sp_analisis_conducta_pagos()`.

Sin embargo, el modelo actual todavía no parece cubrir todos los escenarios requeridos para producción:

- pago adelantado,
- pago de varios meses juntos,
- trazabilidad completa de Stripe,
- método de pago,
- estado/anulación de pagos,
- cobertura desde/hasta,
- dashboard de socios vencidos.

## Hallazgos relevantes

1. La tabla `pago` no incluye campos explícitos de cobertura como `periodo_desde`, `periodo_hasta` o `meses_cubiertos`.
2. La tabla `pago` no incluye `metodo_pago`, `estado`, `stripe_session_id` ni `stripe_payment_intent_id`.
3. El servicio actual de eliminación de pagos intenta actualizar una columna `activo`, que no existe en la tabla `pago`.
4. La lógica de pago manual calcula vencimiento como fecha actual + 30 días, sin modelar cobertura mensual de manera explícita.
5. La lógica Stripe no guarda trazabilidad completa del evento de pago.
6. El historial de precios está asociado a socios, por lo que debe definirse si se trata de precio global o precio individual.

## Riesgos técnicos

- Inconsistencia entre frontend, DTOs, APIs y modelo real de base de datos.
- Posible falla al eliminar pagos.
- Dificultad para calcular estado de cuota vencida de manera precisa.
- Dificultad para soportar pagos adelantados o de varios meses.
- Métricas BI incompletas por falta de datos reales de pagos.

## Recomendación

Antes de tocar UI, conviene cerrar una etapa de diseño técnico del modelo de pagos. Si se requieren cambios en base de datos, deberán implementarse como migraciones formales en `supabase/migrations`, probarse primero en Supabase local y recién luego aplicarse en remoto.

## Próximo paso sugerido

Diseñar e implementar una migración controlada para extender la tabla `pago` o agregar una estructura complementaria que permita:

- método de pago,
- estado/anulación,
- cobertura desde/hasta,
- meses cubiertos,
- trazabilidad Stripe,
- observaciones administrativas.

Luego, crear seeds demo para validar pagos de un socio hombre y una socia mujer, incluyendo pagos en efectivo, Stripe, pagos vencidos y pagos adelantados.
