# i18n ES/EN commercial final sweep compras page labels fix v8

## Objetivo
Corregir textos restantes visibles en Español dentro de `/dashboard/compras` cuando el idioma activo es Inglés.

## Ajustes
- Cards:
  - `Compras activas` → `Active purchases`
  - `Pendientes` → `Pending`
  - `Anuladas` → `Canceled`
  - `Total comprado` → `Total purchased`

- Header y acciones:
  - `Compras a proveedores` → `Supplier purchases`
  - `Comercial` → `Commercial`
  - `Buscar proveedor, comprobante, producto...` → `Search supplier, receipt, product...`
  - `Descargar PDF` → `Download PDF`
  - `Exportar` → `Export`
  - `Nueva compra` → `New purchase`

- Filtros/fechas:
  - `Todas`, `Pagadas`, `Pendientes`, `Anuladas`
  - `Desde`, `Hasta`, `Limpiar fechas`

- Tabla y paginación:
  - `Total de compras listadas` → `Total listed purchases`
  - `Mostrando 1 - 10 de 25 compras.` → `Showing 1 - 10 of 25 purchases.`
  - `compras` → `purchases`

## Alcance
- Solo frontend/i18n.
- No toca DB.
- No toca endpoints.
- No toca Swagger/OpenAPI.
