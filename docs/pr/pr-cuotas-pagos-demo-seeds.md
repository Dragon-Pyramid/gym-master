## Descripción

Este PR incorpora seeds demo para validar el foundation de cuotas, pagos y vencimientos de Gym Master.

La rama crea datos QA determinísticos para cubrir los principales escenarios operativos del gimnasio: socio al día, socio con pago adelantado, socio vencido y socio sin pagos.

## Cambios incluidos

- Se agrega la migración `202605201620_cuotas_pagos_demo_seeds.sql`.
- Se crean usuarios y socios QA determinísticos.
- Se crean cuotas QA para períodos de prueba.
- Se crean pagos QA en efectivo y Stripe simulado.
- Se agrega un caso de pago adelantado de tres meses.
- Se agrega un caso de pago vencido.
- Se conserva un caso sin pagos para validar estado `sin_pagos`.
- Se agregan asistencias QA mínimas para futuras reglas de inactividad.
- Se agrega script de validación SQL.
- Se documenta el uso de estos seeds para futuras tareas de dashboard y API.

## Validaciones esperadas

El script de validación debe confirmar:

- existencia de los socios QA;
- existencia de pagos QA;
- estados correctos desde `obtener_socios_estado_cuota()`;
- resumen por estado de cuota;
- resumen por método de pago;
- compatibilidad con `sp_analisis_conducta_pagos()`.

## Alcance

Este PR no implementa todavía UI ni endpoints nuevos. Su objetivo es preparar datos confiables para probar los próximos bloques funcionales:

- `/api/cuota-estado`;
- dashboard de socios vencidos;
- dashboard BI de pagos/cuotas;
- validación de pago manual;
- validación de flujo Stripe.

## Notas técnicas

- No se inserta manualmente la columna `pago.total` porque es una columna generada.
- La migración usa `ON CONFLICT` para ser segura ante reejecuciones.
- Los datos son QA y pueden distinguirse por emails `@gymmaster.local` y DNIs `QA-PAGO-*`.

## Próximo paso recomendado

Crear la rama:

```bash
feature/cuota-estado-api-dashboard
```

para exponer y visualizar el estado de cuota de cada socio.
