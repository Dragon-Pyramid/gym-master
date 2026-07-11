# Patch - i18n ES/EN admin dashboard final sweep v1 - gestor rutina detalle fix v1

## Objetivo
Corregir textos hardcodeados y mezclas ES/EN visibles desde admin al abrir `View routine` en `/dashboard/gestor-rutinas/rutina/[idRutina]`.

## Alcance
- Header de detalle de rutina.
- Métricas y días.
- Labels de ejercicios, series, repeticiones y descanso.
- Botones visibles desde el detalle.
- Modal de ayuda para series/repeticiones.
- Traducción de nombres demo/seed conocidos solo en presentación.

## Nota
No se cierran los flujos socio-only de rutinas. Quedan para el sweep dedicado del panel socio.

## Archivos modificados
- `src/app/dashboard/gestor-rutinas/rutina/[idRutina]/page.tsx`
- `src/components/dashboard/rutinas/RutinaDisplay.tsx`
