# Patch - i18n ES/EN admin dashboard final sweep v1 - equipamientos preventivos fix v2

## Objetivo
Traducir nombres y tareas demo/semilla de planes preventivos activos en `/dashboard/infraestructura/equipamientos/preventivos`.

## Cambios
- Agrega helpers de presentación para tipos de equipamiento, nombres de planes y tareas técnicas.
- En inglés traduce los planes preventivos activos y sus tareas sin modificar valores de base de datos.
- Conserva español cuando el idioma activo es ES.

## Archivo modificado
- `src/app/dashboard/infraestructura/equipamientos/preventivos/page.tsx`
