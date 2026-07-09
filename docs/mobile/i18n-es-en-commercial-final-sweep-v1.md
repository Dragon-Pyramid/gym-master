# i18n ES/EN commercial final sweep v1

## Objetivo
Realizar una segunda pasada de internacionalización sobre el área comercial de Gym Master, cubriendo pantallas y componentes vinculados que no forman parte directa de `/dashboard/comercial/*` pero se abren desde el flujo comercial.

## Alcance
- Páginas relacionadas:
  - `/dashboard/productos`
  - `/dashboard/ventas`
  - `/dashboard/proveedores`
  - `/dashboard/servicios`
  - `/dashboard/compras`
- Formularios comerciales:
  - Producto
  - Servicio
  - Proveedor
  - Venta
  - Compra/reposición
  - Gasto operativo
  - Movimiento de stock de producto
- Tablas comerciales:
  - Productos
  - Servicios
  - Proveedores
  - Ventas
  - Compras
- Modales comerciales:
  - Producto
  - Servicio
  - Proveedor
  - Venta
  - Compra/reposición

## Ajustes
- Se agregaron claves al helper `src/i18n/commercialUi.ts`.
- Se conectaron páginas y componentes al provider i18n mediante `useI18n` + `translateCommercialUi`.
- Se tradujeron títulos, botones, filtros, placeholders, mensajes de confirmación, toasts, labels de tablas, captions y textos de formularios visibles.

## Restricciones
- No se modifican datos reales de base de datos.
- No se agregan endpoints.
- No se modifican migraciones.
- No se modifica Swagger/OpenAPI.
