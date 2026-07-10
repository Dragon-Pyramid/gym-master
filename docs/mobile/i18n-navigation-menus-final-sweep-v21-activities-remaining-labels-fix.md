# i18n navigation menus final sweep v21 - Activities remaining labels fix

## Objetivo

Corregir remanentes puntuales de textos mixtos ES/EN en `/dashboard/actividades`.

## Ajustes puntuales

Se agregan traducciones exactas al `DashboardInlineI18nSweep`:

- `Enrolleds por actividad` → `Enrolled by activity`
- `Inscritos por actividad` → `Enrolled by activity`
- `Cancelar edición` → `Cancel editing`
- `Refresh turno` → `Refresh shift`
- `Name de Activity` → `Activity name`
- `Creado en` → `Created on`
- `Currentizado en` → `Updated on`
- `Actualizado en` → `Updated on`
- `Total de actividades` → `Total activities`

## Nota técnica

Las traducciones se incorporan como exact-only para no afectar textos parciales ni generar reemplazos peligrosos en el sweep bidireccional.

## Alcance

- Solo frontend/i18n.
- Sin cambios en DB.
- Sin cambios en endpoints.
- Sin cambios en Swagger/OpenAPI.
- Sin cambios en lógica de turnos, inscripciones o actividades.
