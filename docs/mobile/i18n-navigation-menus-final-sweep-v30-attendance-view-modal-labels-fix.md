# i18n navigation menus final sweep v30 - Attendance view modal labels fix

## Objetivo

Corregir remanentes puntuales de textos mixtos ES/EN en el modal de detalle de asistencia dentro de `/dashboard/asistencias`.

## Ajuste directo

Se actualiza `src/components/modal/AsistenciaViewModal.tsx` para usar `useI18n()` directamente en los labels fijos del modal:

- `Detalles de Asistencia` → `Attendance details`
- `ID Asistencia` → `Attendance ID`
- `ID Socio` → `Member ID`
- `Fecha` → `Date`
- `Hora Ingreso` → `Check-in time`
- `Hora Egreso` → `Check-out time`
- `Cerrar` → `Close`

## Nota técnica

Este ajuste se realiza directo en el modal y no mediante `DashboardInlineI18nSweep`, porque son labels fijos y es más seguro controlarlos por idioma desde el componente.

## Alcance

- Solo frontend/i18n.
- Solo modal de detalle de asistencia.
- Sin cambios en DB.
- Sin cambios en endpoints.
- Sin cambios en Swagger/OpenAPI.
- Sin cambios en lógica de asistencias o aforo.
- Sin cambios en PDF/Excel generados.
