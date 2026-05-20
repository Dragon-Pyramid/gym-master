# PR: Dashboard BI de cuotas y pagos

## Resumen

Este PR agrega una primera vista administrativa de Business Intelligence para cuotas y pagos, construida sobre el modelo de pagos ya corregido y los datos reales/demo disponibles en Gym Master.

## Cambios principales

- Se agrega el endpoint `/api/admin/cuotas/dashboard-bi`.
- Se agrega la página `/dashboard/bi-cuotas-pagos`.
- Se agrega el componente `CuotasPagosBI`.
- Se agrega cliente browser para consumir el endpoint.
- Se agrega interfaz tipada para la respuesta del dashboard.
- Se agrega script SQL de validación.
- Se documenta la feature en `docs/cuotas-pagos/dashboard-bi-cuotas-pagos.md`.

## Indicadores incluidos

- Socios al día.
- Socios vencidos.
- Socios sin pagos.
- Total cobrado.
- Total por efectivo.
- Total por Stripe.
- Pagos recientes.
- Listado de socios vencidos.
- Listado de socios sin pagos.
- Último precio de cuota.
- Evolución histórica del precio de cuota.

## Validaciones sugeridas

```bash
npm run build
npm run dev
```

Validar visualmente:

```txt
/dashboard/bi-cuotas-pagos
```

Validar SQL:

```bash
docker exec -i supabase_db_gym-master psql -U postgres -d postgres < database/scripts/validar_dashboard_bi_cuotas_pagos.sql
```

## Notas

Esta feature no agrega migraciones. Usa la estructura creada previamente en la foundation de cuotas/pagos y los datos demo/reales ya cargados.
