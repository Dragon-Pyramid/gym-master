# i18n ES/EN commercial final sweep ventas pagination labels fix v7

## Objetivo
Corregir textos restantes visibles en Español dentro de `/dashboard/ventas` cuando el idioma activo es Inglés.

## Ajustes
- Tabla/listado:
  - `Total de ventas` → `Total sales`
  - `Mostrando 1 - 10 de 998 ventas.` → `Showing 1 - 10 of 998 sales.`
  - `Anterior` → `Previous`
  - `Siguiente` → `Next`
  - `Página 1 de 100` → `Page 1 of 100`

- Acciones:
  - `Ver` → `View`
  - `Anular` → `Cancel`

- Valores runtime:
  - `Consumidor Final` → `Final consumer`
  - `Visitante` → `Visitor`
  - `Socio` → `Member`
  - `Efectivo` → `Cash`
  - `Debito/Débito` → `Debit`
  - estados como `pagada`/`anulada`.

## Alcance
- Solo frontend/i18n.
- No toca DB.
- No toca endpoints.
- No toca Swagger/OpenAPI.
