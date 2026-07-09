# i18n ES/EN commercial final sweep servicios page labels fix v13

## Objetivo
Corregir textos restantes visibles en Español dentro de `/dashboard/servicios` cuando el idioma activo es Inglés.

## Ajustes
- Header:
  - `Listado de Servicios` → `Service list`
  - `Todos` / `Todas` → `All`
  - `Buscar por nombre, descripción...` → `Search by name, description...`
  - `Descargar PDF` → `Download PDF`
  - `Exportar` → `Export`

- Tabla:
  - `Sí` → `Yes`
  - `No` → `No`
  - `Ver` → `View`
  - `Desactivar` → `Deactivate`
  - `Total servicios` → `Total services`

- Paginación:
  - `Showing 1 - 10 of 16 servicios.` → `Showing 1 - 10 of 16 services.`

- Datos demo visibles:
  - `Alquiler`, `Cama Solar`, `Clase especial funcional`, `Evaluación física inicial`, `Pase diario`, etc. se muestran en Inglés cuando el idioma activo es EN.

## Alcance
- Solo frontend/i18n.
- No toca DB.
- No toca endpoints.
- No toca Swagger/OpenAPI.
