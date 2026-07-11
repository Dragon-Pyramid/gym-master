# Patch - i18n ES/EN admin dashboard final sweep v1 - equipamientos fix v3

## Objetivo
Corregir el último empty state en español dentro de `/dashboard/equipamientos`.

## Cambio
- `No hay equipos con recomendación de reemplazo en este momento.` -> `There is no equipment with a replacement recommendation at this time.` cuando el idioma activo es EN.

## Archivo modificado
- `src/app/dashboard/equipamientos/page.tsx`
