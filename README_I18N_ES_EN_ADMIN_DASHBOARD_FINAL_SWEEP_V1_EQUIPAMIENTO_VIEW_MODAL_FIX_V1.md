# Patch - i18n ES/EN admin dashboard final sweep v1 - equipamiento view modal fix v1

## Objetivo
Corregir textos hardcodeados ES/EN del modal de detalle de equipamiento abierto desde `/dashboard/equipamientos`.

## Cambios
- Se incorporó `useI18n()` y helper `tx(es, en)`.
- Se tradujo el título del modal, labels principales, historial de mantenimiento y campos Responsable/Costo.
- Se tradujo el estado del equipo para valores conocidos: operativo, en mantenimiento y fuera de servicio.

## Archivo modificado
- `src/components/modal/EquipamientoViewModal.tsx`
