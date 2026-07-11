# Patch - i18n ES/EN admin dashboard final sweep v1 - equipamiento edit modal labels fix v1

## Objetivo
Agregar labels visibles y bilingües al modal de alta/edición de equipamiento.

## Cambios principales
- `EquipamientoModal.tsx` ahora usa `useI18n()` para títulos y botón de mantenimiento.
- `EquipamientoForm.tsx` ahora usa `useI18n()` y agrega labels visibles para todos los inputs/selects.
- Labels y placeholders ES/EN:
  - Nombre / Name
  - Tipo / Type
  - Marca / Brand
  - Modelo / Model
  - Estado / Status
  - Ubicación / Location
  - Próxima revisión / Next review
  - Observaciones / Notes
- Se traducen botones Cancelar/Actualizar/Guardar y estados conocidos.
- Se traducen labels de catálogos fallback/conocidos sin modificar el valor guardado en DB.

## Archivos modificados
- `src/components/modal/EquipamientoModal.tsx`
- `src/components/forms/EquipamientoForm.tsx`
