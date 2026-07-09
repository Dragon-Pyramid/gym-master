# i18n ES/EN commercial final sweep productos page labels fix v9

## Objetivo
Corregir textos restantes visibles en Español dentro de `/dashboard/productos` cuando el idioma activo es Inglés.

## Ajustes
- Cards:
  - `Productos activos` → `Active products`
  - `Sin stock` → `Out of stock`
  - `Inventario estimado` → `Estimated inventory`

- Header:
  - `Productos del kiosco` → `Kiosk products`
  - `Control operativo de productos, stock y estado comercial.` → `Operational control of products, stock and commercial status.`
  - `Comercial`, `Descargar PDF`, `Exportar`

- Filtros:
  - `Todos` → `All`
  - `Activos` → `Active`
  - `Sin stock` → `Out of stock`
  - `Inactivos / discontinuados` → `Inactive / discontinued`

- Tabla:
  - `SKU`
  - `Barra` → `Barcode`
  - `Ver` → `View`
  - `Desactivar` → `Deactivate`
  - `Movimiento de stock` → `Stock movement`

- Runtime/demo data:
  - `Producto 1`, `Producto 2`, etc. se muestran como `Product 1`, `Product 2`, etc. cuando idioma activo es Inglés.
  - `Descripción del producto 1`, etc. se muestran como `Product 1 description`.

## Alcance
- Solo frontend/i18n.
- No toca DB.
- No toca endpoints.
- No toca Swagger/OpenAPI.
