# i18n navigation menus final sweep v31 - Attendance edit modal/form labels fix

## Objetivo

Corregir textos híbridos ES/EN en el modal de alta/edición de asistencias.

## Ajustes directos

### `AsistenciaModal.tsx`

- `Editar Asistencia` → `Edit attendance`
- `Nueva Asistencia` → `New attendance`

### `AsistenciaForm.tsx`

- `ID Socio` → `Member ID`
- `Ingrese ID del socio` → `Enter member ID`
- `Fecha` → `Date`
- `Hora Ingreso` → `Check-in time`
- `Hora Egreso` → `Check-out time`
- `HH:MM (Opcional)` → `HH:MM (Optional)`
- `Guardando...` → `Saving...`
- `Actualizar Asistencia` → `Update attendance`
- `Registrar Asistencia` → `Register attendance`
- `Cancelar` → `Cancel`
- toasts y errores locales del formulario.

## Nota técnica

El ajuste utiliza `useI18n()` directamente en ambos componentes. No depende del sweep global y no modifica datos ni comportamiento del formulario.

## Alcance

- Solo frontend/i18n.
- Sin cambios en DB.
- Sin cambios en endpoints.
- Sin cambios en Swagger/OpenAPI.
- Sin cambios en lógica de asistencia o aforo.
- Sin cambios en PDF/Excel.
