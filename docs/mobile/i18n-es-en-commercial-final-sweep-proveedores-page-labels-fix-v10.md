# i18n ES/EN commercial final sweep proveedores page labels fix v10

## Objetivo
Corregir textos restantes visibles en Español dentro de `/dashboard/proveedores` cuando el idioma activo es Inglés.

## Ajustes
- Cards:
  - `Activos` → `Active`
  - `Inactivos` → `Inactive`
  - `Discontinuados` → `Discontinued`

- Header y acciones:
  - `Listado de Proveedores` → `Supplier list`
  - `Gestión comercial, fiscal, contacto, ubicación y datos bancarios opcionales.` → `Commercial, tax, contact, location and optional banking data management.`
  - `Buscar proveedor...` → `Search supplier...`
  - `Todos los estados` → `All statuses`
  - `Descargar PDF` → `Download PDF`
  - `Exportar` → `Export`

- Tabla:
  - `Fiscal` → `Tax`
  - `Ver` → `View`
  - `Total de proveedores` → `Total suppliers`
  - `Listado de proveedores registrados.` → `Registered supplier list.`

- Valores runtime:
  - `Responsable inscripto` → `Registered taxpayer`
  - `Monotributo` → `Monotax`
  - `Activo`, `Inactivo`, `Discontinuado`.

- Paginación:
  - `Showing 1 - 10 of 11 proveedores.` → `Showing 1 - 10 of 11 suppliers.`

## Ajuste técnico adicional
- Se elimina una declaración duplicada accidental de `proveedorVer` en `src/app/dashboard/proveedores/page.tsx`.

## Alcance
- Solo frontend/i18n.
- No toca DB.
- No toca endpoints.
- No toca Swagger/OpenAPI.
