# Cuotas y pagos: API de estado de cuota y dashboard administrativo

## Objetivo

Esta feature conecta la base de cuotas/pagos preparada en ramas anteriores con la aplicación web de Gym Master.

El sistema ya cuenta con:

- `obtener_estado_cuota_socio(p_id_socio uuid)`
- `obtener_socios_estado_cuota()`
- datos QA para socios al día, vencidos, sin pagos, pagos en efectivo y Stripe simulado

Con esta rama se exponen esos datos mediante API Routes y se muestran en el dashboard administrativo.

## Endpoints agregados

### `GET /api/cuota-estado`

Endpoint general para consultar estado de cuota.

Comportamiento:

- Si el usuario logueado es `socio`, devuelve el estado de cuota de su propio `id_socio`.
- Si el usuario logueado es `admin` o `usuario` y envía `?socio_id=...`, devuelve el estado del socio solicitado.
- Si el usuario logueado es `admin` o `usuario` y no envía `socio_id`, devuelve el resumen administrativo completo.

### `GET /api/admin/cuotas/estado-socios`

Endpoint administrativo para dashboard.

Devuelve:

- resumen general de estados de cuota
- listado completo de socios con estado de cuota
- socios vencidos
- socios sin pagos
- socios próximos a vencer
- resumen de pagos por método

### `GET /api/admin/cuotas/resumen`

Endpoint administrativo reducido para futuras cards o widgets.

Devuelve:

- resumen
- pagos por método
- socios vencidos
- socios sin pagos
- socios próximos a vencer

## Servicios agregados

### `src/services/server/cuotaEstadoServerService.ts`

Servicio server-side que usa `SUPABASE_SERVICE_ROLE_KEY` desde API Routes.

Funciones principales:

- `getEstadoCuotaSocioServer()`
- `getSociosEstadoCuotaServer()`
- `getPagosPorMetodoServer()`
- `getAdminCuotasEstadoServer()`

## Frontend agregado

### `src/components/dashboard/cuotas/CuotasEstadoDashboard.tsx`

Componente de dashboard para administradores.

Muestra:

- total de socios
- socios al día
- socios vencidos
- socios sin pagos
- total cobrado por método
- tabla de socios con atención requerida
- pagos agrupados por método

## Archivos modificados

- `src/app/dashboard/page.tsx`
- `src/services/apiClient.ts`

## Archivos nuevos

- `src/interfaces/cuotaEstado.interface.ts`
- `src/services/server/cuotaEstadoServerService.ts`
- `src/app/api/cuota-estado/route.ts`
- `src/app/api/admin/cuotas/estado-socios/route.ts`
- `src/app/api/admin/cuotas/resumen/route.ts`
- `src/components/dashboard/cuotas/CuotasEstadoDashboard.tsx`

## Validaciones sugeridas

1. Login como administrador.
2. Entrar al dashboard.
3. Confirmar sección `Estado de cuotas`.
4. Confirmar que aparecen los datos QA:
   - `QA Socio Al Dia` como `al_dia`
   - `QA Socia Adelantada` como `al_dia`
   - `QA Socio Vencido` como `vencido`
   - `QA Socia Sin Pagos` como `sin_pagos`
5. Probar endpoint `/api/cuota-estado` con usuario socio.
6. Probar endpoint `/api/admin/cuotas/estado-socios` con usuario admin.
7. Ejecutar `npm run build`.

## Próximos pasos

Esta feature deja visible la lógica de cuotas en dashboard. Los siguientes bloques recomendados son:

- pago manual desde administrador usando los nuevos campos de `pago`
- integración final de Stripe/webhook con `periodo_desde`, `periodo_hasta`, `metodo_pago` y `estado`
- reglas operativas para socios vencidos e inactivación automática
- BI avanzado de cuotas y pagos
