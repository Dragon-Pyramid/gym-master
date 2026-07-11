# Patch - i18n ES/EN admin dashboard final sweep v1 - infraestructura mantenimiento edilicio fix v1

## Objetivo
Corregir textos hardcodeados y mezclas ES/EN en la pantalla:

- `/dashboard/infraestructura/mantenimiento-edilicio`

## Cambios principales
- Se incorporó `useI18n()` en la página.
- Se agregó helper `tx(es, en)` para resolver etiquetas ES/EN en tiempo de render.
- Se tradujeron:
  - hero/banner principal
  - métricas
  - lectura ejecutiva
  - formularios de sector / activo / orden / checklist / QR
  - lector QR/barra
  - checklists recientes
  - códigos activos
  - alertas edilicias
  - órdenes abiertas
  - inventario edilicio
  - mensajes de éxito/error
  - etiquetas de impresión QR
- Se agregaron helpers para traducir labels dinámicos:
  - tipos de sector
  - prioridades / criticidad
  - tipos de orden
  - resultado de checklist
  - target type QR
  - estados de activo

## Archivo modificado
- `src/app/dashboard/infraestructura/mantenimiento-edilicio/page.tsx`
