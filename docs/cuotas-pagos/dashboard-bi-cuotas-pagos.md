# Dashboard BI de cuotas y pagos

## Objetivo

Agregar una vista administrativa para analizar el estado económico-operativo de cuotas y pagos dentro de Gym Master.

## Alcance

Esta feature incorpora:

- Endpoint `/api/admin/cuotas/dashboard-bi`.
- Página `/dashboard/bi-cuotas-pagos`.
- Componente visual `CuotasPagosBI`.
- Cliente browser para consumir el endpoint.
- Script SQL de validación.

## Indicadores incluidos

- Socios al día.
- Socios vencidos.
- Socios sin pagos.
- Total cobrado histórico según datos actuales de `pago`.
- Total por método de pago: efectivo y Stripe.
- Pagos recientes.
- Listado de socios vencidos.
- Listado de socios sin pagos.
- Último precio de cuota.
- Evolución histórica del precio de cuota.

## Dependencias

La feature depende de las funciones y columnas creadas en ramas anteriores:

- `obtener_socios_estado_cuota()`.
- `obtener_evolucion_cuota()`.
- `pago.periodo_desde`.
- `pago.periodo_hasta`.
- `pago.meses_cubiertos`.
- `pago.metodo_pago`.
- `pago.estado`.
- `pago.activo`.

## Validación

Ejecutar:

```bash
npm run build
npm run dev
```

Luego visitar:

```txt
/dashboard/bi-cuotas-pagos
```

Validar también con:

```bash
docker exec -i supabase_db_gym-master psql -U postgres -d postgres < database/scripts/validar_dashboard_bi_cuotas_pagos.sql
```

## Pendientes futuros

- Integrar la entrada al menú administrativo.
- Agregar gráficos visuales con Recharts u otra librería.
- Agregar filtros por rango de fecha.
- Diferenciar cobros reales, cancelados, pendientes y reembolsados.
- Agregar exportación PDF/Excel para reportes administrativos.
