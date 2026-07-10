# i18n navigation menus final sweep v28 - Salary modal required labels fix

## Objetivo

Corregir remanentes puntuales de textos mixtos ES/EN en el modal `Edit salary` / `New salary` dentro de `/dashboard/empleados-sueldos`.

## Diagnóstico

El v27 ya cubría etiquetas base como `Empleado`, `Período`, `Bonos` y `Neto`, pero el modal renderiza algunas variantes con símbolos o dos puntos:

- `Empleado *`
- `Período *`
- `Empleado:`
- `Bonos:`
- `Neto:`

Al estar trabajando con traducciones exact-only para no provocar reemplazos parciales peligrosos, esas variantes deben declararse explícitamente.

## Ajustes puntuales

Se agregan traducciones exactas para:

- `Empleado *` → `Employee *`
- `Período *` → `Period *`
- `Concepto` → `Concept`
- `URL de comprobante` → `Receipt URL`
- `Empleado:` → `Employee:`
- `Bonos:` → `Bonuses:`
- `Neto:` → `Net:`
- `Sueldo mensual demo` → `Monthly salary demo`
- `dd/mm/aaaa` → `dd/mm/yyyy`

## Alcance

- Solo frontend/i18n.
- Sin cambios en DB.
- Sin cambios en endpoints.
- Sin cambios en Swagger/OpenAPI.
- Sin cambios en lógica de sueldos.
- Sin cambios en PDF/Excel.
