# i18n navigation menus final sweep v25 - Employee edit modal labels fix

## Objetivo

Corregir remanentes puntuales de textos mixtos ES/EN en el modal de edición de empleado dentro de `/dashboard/empleados`.

## Ajustes puntuales

Se agregan traducciones exactas al `DashboardInlineI18nSweep` para:

- `Edit empleado` → `Edit employee`
- `Editar empleado` → `Edit employee`
- `Tipo de empleado` → `Employee type`
- `Puesto / responsabilidad` → `Position / responsibility`
- `Sueldo base de referencia` → `Reference base salary`
- `Notes internas` → `Internal notes`
- `Notas internas` → `Internal notes`

## Nota técnica

Las traducciones se incorporan como exact-only para evitar reemplazos parciales peligrosos y mantener estable el sweep bidireccional.

## Alcance

- Solo frontend/i18n.
- Sin cambios en DB.
- Sin cambios en endpoints.
- Sin cambios en Swagger/OpenAPI.
- Sin cambios en lógica de empleados.
- Sin cambios en datos cargados del empleado.
