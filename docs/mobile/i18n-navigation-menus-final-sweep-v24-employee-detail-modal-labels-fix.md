# i18n navigation menus final sweep v24 - Employee detail modal labels fix

## Objetivo

Corregir remanentes puntuales de textos mixtos ES/EN en el modal de detalle de empleado dentro de `/dashboard/empleados`.

## Ajustes puntuales

Se agregan traducciones exactas al `DashboardInlineI18nSweep` para:

- `Detalle de empleado` → `Employee detail`
- `Puesto` → `Position`
- `Área` → `Area`
- `Date de inicio laboral` → `Employment start date`
- `Date de baja laboral` → `Employment end date`
- `Tipo de contratación` → `Employment type`
- `Sueldo base` → `Base salary`
- `Horarios / disponibilidad` → `Schedule / availability`
- `mensual` → `Monthly`
- `Tarde` → `Afternoon`
- `Administración y caja` → `Administration and cash desk`
- `Monday a viernes de 15:00 a 18:00` → `Monday to Friday from 15:00 to 18:00`

## Nota técnica

Las traducciones se incorporan como exact-only para evitar reemplazos parciales peligrosos y mantener estable el sweep bidireccional.

## Alcance

- Solo frontend/i18n.
- Sin cambios en DB.
- Sin cambios en endpoints.
- Sin cambios en Swagger/OpenAPI.
- Sin cambios en lógica de empleados.
