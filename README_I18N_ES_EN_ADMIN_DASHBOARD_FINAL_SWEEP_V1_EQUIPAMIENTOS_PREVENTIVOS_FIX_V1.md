# Patch - i18n ES/EN admin dashboard final sweep v1 - equipamientos preventivos fix v1

## Objetivo
Corregir textos hardcodeados y mezclas ES/EN en `/dashboard/infraestructura/equipamientos/preventivos`.

## Cambios principales
- Incorpora `useI18n()` con helper `tx(es, en)`.
- Traduce hero, métricas, formularios, labels, botones, selects, estados vacíos, órdenes abiertas, historial técnico y planes activos.
- Traduce labels dinámicos conocidos para criticidad, tipo de orden, prioridad y eventos técnicos sin cambiar valores enviados al backend.

## Archivo modificado
- `src/app/dashboard/infraestructura/equipamientos/preventivos/page.tsx`
