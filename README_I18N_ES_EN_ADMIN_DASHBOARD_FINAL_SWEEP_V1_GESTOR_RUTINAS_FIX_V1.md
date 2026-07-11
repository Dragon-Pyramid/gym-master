# Patch - i18n ES/EN admin dashboard final sweep v1 - gestor rutinas fix v1

## Objetivo
Corregir textos residuales y mezclas ES/EN en `/dashboard/gestor-rutinas`.

## Cambios
- Se agregó `useI18n()` en la página, grid y card de socio/rutina.
- Se tradujeron título, buscador, loading, empty state, cards, estados, labels de última rutina, días/ejercicios, fecha de creación y botones.
- Se tradujeron nombres generados por sistema como `Rutina auto ...`, `Rutina sin nombre` y `Sin rutina asignada` solo en presentación, sin tocar datos de DB.

## Archivos modificados
- `src/app/dashboard/gestor-rutinas/page.tsx`
- `src/components/gestor-rutinas/SocioRutinaCard.tsx`
- `src/components/gestor-rutinas/SociosRutinasGrid.tsx`
