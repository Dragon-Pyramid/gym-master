# PR: feature/cuota-estado-api-dashboard

## Resumen

Este PR implementa la primera visualización operativa de cuotas/pagos dentro del dashboard administrativo de Gym Master.

A partir de la foundation de pagos/cuotas y de los seeds QA ya validados, se agregan endpoints para consultar estados de cuota y un componente visual en el dashboard para mostrar socios al día, vencidos, sin pagos, pagos por método y socios con atención requerida.

## Cambios principales

### API Routes

- Se agrega `GET /api/cuota-estado`.
- Se agrega `GET /api/admin/cuotas/estado-socios`.
- Se agrega `GET /api/admin/cuotas/resumen`.

### Backend server-side

- Se agrega `src/services/server/cuotaEstadoServerService.ts`.
- Se consumen las funciones SQL:
  - `obtener_estado_cuota_socio(p_id_socio uuid)`
  - `obtener_socios_estado_cuota()`
- Se agrega agrupación server-side de pagos por método.
- Se agrega resumen administrativo de estados de cuota.

### Frontend

- Se agrega `CuotasEstadoDashboard` en el dashboard administrativo.
- Se agregan cards de:
  - total socios
  - al día
  - vencidos
  - sin pagos
  - total cobrado
- Se agrega tabla de socios con atención requerida.
- Se agrega resumen de pagos por método.

### Cliente API

Se agregan helpers en `src/services/apiClient.ts`:

- `getCuotaEstado()`
- `getAdminCuotasEstadoSocios()`
- `getAdminCuotasResumen()`

## Contexto técnico

Esta feature se apoya en ramas previas donde ya se implementó:

- ampliación de tabla `pago`
- funciones de estado de cuota
- seeds QA para socios al día, vencidos, sin pagos, efectivo y Stripe simulado

## Validaciones sugeridas

- `npm run build`
- Login como administrador
- Revisar dashboard principal
- Confirmar que se ve la sección `Estado de cuotas`
- Confirmar datos QA:
  - `QA Socio Al Dia` al día
  - `QA Socia Adelantada` al día con Stripe y 3 meses cubiertos
  - `QA Socio Vencido` vencido
  - `QA Socia Sin Pagos` sin pagos

## Notas

Este PR no agrega nuevas migraciones de base de datos. Consume funciones y datos ya creados y validados en ramas previas.
