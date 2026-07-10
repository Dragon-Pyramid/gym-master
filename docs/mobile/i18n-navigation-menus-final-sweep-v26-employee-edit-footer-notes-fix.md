# i18n navigation menus final sweep v26 - Employee edit footer notes fix

## Objetivo

Corregir remanentes puntuales de textos mixtos ES/EN al final del modal de edición de empleado dentro de `/dashboard/empleados`.

## Ajustes puntuales

Se agregan traducciones exactas al `DashboardInlineI18nSweep` para:

- `Empleado activo` / `Empleado active` → `Active employee`
- `Puesto, área y turno se cargan desde combos base para mantener datos homogéneos. Más adelante estos valores podrán moverse a catálogos parametrizables administrados por cada gimnasio.` → `Position, area and shift are loaded from base combos to keep data consistent. Later these values may move to configurable catalogs managed by each gym.`
- `Este empleado es administrativo. En una próxima feature se desplegarán aquí los permisos de menú/RBAC para definir qué módulos puede ver y utilizar.` → `This employee is administrative. In a future feature, menu/RBAC permissions will be displayed here to define which modules they can view and use.`
- `Refresh empleado` → `Refresh employee`

## Nota técnica

Las traducciones se incorporan como exact-only para evitar reemplazos parciales peligrosos y mantener estable el sweep bidireccional.

## Alcance

- Solo frontend/i18n.
- Sin cambios en DB.
- Sin cambios en endpoints.
- Sin cambios en Swagger/OpenAPI.
- Sin cambios en lógica de empleados.
- Sin cambios en datos cargados del empleado.
