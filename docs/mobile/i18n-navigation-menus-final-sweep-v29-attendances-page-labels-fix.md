# i18n navigation menus final sweep v29 - Attendances page labels fix

## Objetivo

Corregir remanentes puntuales de textos ES/EN en `/dashboard/asistencias`.

## Ajuste directo en page

Se actualiza `src/app/dashboard/asistencias/page.tsx` para usar `useI18n()` en textos propios de la pantalla:

- `Asistencias` → `Attendances`
- `Dentro ahora` → `Inside now`
- `Capacidad configurada` → `Configured capacity`
- `Ocupación` → `Occupancy`
- `Estado` → `Status`
- `Listado de Asistencias` → `Attendance roster`
- `Buscar...` → `Search...`
- `Todos los períodos` → `All periods`
- `Salida / Aforo` → `Exit / Capacity`
- `Modo terminal` → `Terminal mode`
- `Añadir Asistencia` → `Add attendance`
- `Actualización automática cada 5s.` → `Automatic refresh every 5s.`
- `Última actualización` → `Last update`
- paginación inferior a formato inglés.

También se traduce localmente el mensaje de aforo que llega del servicio:

- `Ocupación normal. Hay disponibilidad operativa.` → `Normal occupancy. Operational capacity is available.`

No se toca el servicio ni el endpoint.

## Ajuste directo en tabla

Se actualiza `src/components/tables/AsistenciaTable.tsx` para traducir encabezados y caption:

- `Nombre de Socio` → `Member name`
- `Hora Ingreso` → `Check-in time`
- `Hora Egreso` → `Check-out time`
- `Ver` → `View`
- `Total de asistencias` → `Total attendances`
- `Listado de asistencias registradas.` → `Registered attendance list.`

## Exact-only guard

Se agregan traducciones exactas al `DashboardInlineI18nSweep` como capa defensiva para remanentes visibles relacionados con asistencias.

## Alcance

- Solo frontend/i18n.
- Sin cambios en DB.
- Sin cambios en endpoints.
- Sin cambios en Swagger/OpenAPI.
- Sin cambios en lógica de asistencias o aforo.
- Sin cambios en PDF/Excel generados.
