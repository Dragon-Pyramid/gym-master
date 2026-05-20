# Seeds demo de cuotas, pagos y vencimientos

## Objetivo

Esta rama incorpora datos QA determinísticos para probar el nuevo foundation de cuotas/pagos sin depender de datos reales de clientes.

Los seeds permiten validar:

- socio al día;
- socio con pago adelantado por varios meses;
- socio vencido;
- socio sin pagos;
- pago en efectivo;
- pago Stripe simulado;
- lectura desde `obtener_socios_estado_cuota()`;
- base para futuros dashboards de morosidad, pagos e ingresos.

## Migración incluida

```txt
supabase/migrations/202605201620_cuotas_pagos_demo_seeds.sql
```

La migración es idempotente y usa UUIDs determinísticos para evitar duplicados.

## Socios QA creados

| Caso | Socio | Estado esperado |
|---|---|---|
| Pago efectivo actual | QA Socio Al Dia | al_dia |
| Pago Stripe adelantado | QA Socia Adelantada | al_dia |
| Pago antiguo vencido | QA Socio Vencido | vencido |
| Sin pago | QA Socia Sin Pago | sin_pagos |

## Pagos QA

La migración crea tres pagos:

1. Pago en efectivo de un mes.
2. Pago Stripe simulado de tres meses por adelantado.
3. Pago vencido para validar morosidad.

No se inserta manualmente la columna `pago.total`, porque en la base actual es una columna generada.

## Validación

Script incluido:

```txt
database/scripts/validar_cuotas_pagos_demo_seeds.sql
```

Validaciones principales:

- socios QA existentes;
- pagos QA existentes;
- estados de cuota por socio;
- resumen por estado;
- resumen por método de pago;
- salida parcial de `sp_analisis_conducta_pagos()`.

## Flujo operativo obligatorio

1. Aplicar el paquete en la rama `feature/cuotas-pagos-demo-seeds`.
2. Probar la migración en Supabase local.
3. Ejecutar el script de validación.
4. Si pasa correctamente, aplicar remoto con Supabase CLI.
5. Confirmar historial con `npx supabase migration list`.
6. Hacer commit, push, PR e informe técnico.

## Próximo paso después de esta rama

Con los datos QA disponibles, el siguiente bloque recomendado será construir el endpoint faltante y/o dashboard:

```txt
feature/cuota-estado-api-dashboard
```

Objetivo: exponer y mostrar en la app el estado de cuota del socio y el listado de socios vencidos o sin pagos.
