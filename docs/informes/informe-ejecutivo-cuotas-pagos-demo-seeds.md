# Informe técnico - Seeds demo de cuotas, pagos y vencimientos

## Resumen ejecutivo

Se incorpora una base de datos QA determinística para validar el módulo de cuotas, pagos y vencimientos de Gym Master. Esta etapa permite probar los estados reales de cuota sin depender de pagos reales cargados por usuarios.

## Contexto

La rama anterior dejó preparada la estructura de pagos con campos para período cubierto, método de pago, estado, trazabilidad Stripe y funciones de estado de cuota. Sin embargo, la base remota no tenía pagos reales cargados, por lo que todos los socios aparecían como `sin_pagos`.

## Solución implementada

Se agrega una migración con datos QA para los casos operativos principales:

- socio al día con pago en efectivo;
- socia con pago adelantado por tres meses mediante Stripe simulado;
- socio vencido;
- socia sin pagos.

También se agregan cuotas QA y asistencias mínimas para futuras reglas de inactividad.

## Archivos agregados

- `supabase/migrations/202605201620_cuotas_pagos_demo_seeds.sql`
- `database/scripts/validar_cuotas_pagos_demo_seeds.sql`
- `docs/cuotas-pagos/seeds-demo-cuotas-pagos.md`
- `docs/pr/pr-cuotas-pagos-demo-seeds.md`
- `docs/informes/informe-ejecutivo-cuotas-pagos-demo-seeds.md`

## Validación esperada

El script de validación permite confirmar:

- creación de socios QA;
- creación de pagos QA;
- estado de cuota por socio;
- resumen por estado;
- resumen por método de pago;
- compatibilidad con la función de Data Science `sp_analisis_conducta_pagos()`.

## Impacto

Este bloque no modifica la UI, pero desbloquea el trabajo del dashboard y de los endpoints de cuota. A partir de estos datos, se podrán desarrollar y probar pantallas con socios al día, vencidos, sin pagos y pagos adelantados.

## Próximo paso recomendado

Implementar la rama `feature/cuota-estado-api-dashboard`, orientada a exponer el estado de cuota desde API y mostrarlo en el dashboard de inicio/administración.
