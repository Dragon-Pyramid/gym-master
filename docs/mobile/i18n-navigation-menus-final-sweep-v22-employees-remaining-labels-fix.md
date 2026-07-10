# i18n navigation menus final sweep v22 - Employees remaining labels fix

## Objetivo

Corregir remanentes puntuales de textos mixtos ES/EN en `/dashboard/empleados`.

## Ajustes puntuales

Se agregan traducciones exactas al `DashboardInlineI18nSweep` para:

- `Total empleados` → `Total employees`
- `Administrativos` → `Administrative`
- `Nómina estimada` → `Estimated payroll`
- `Listado de Empleados` / `Readydo de Empleados` → `Employee roster`
- `Gestión integral de empleados, responsabilidades y base para sueldos/RBAC.` → `Comprehensive employee management, responsibilities and payroll/RBAC base.`
- `Todos los tipos` / `All los tipos` → `All types`
- `Añadir Empleado` → `Add employee`
- `Empleado` → `Employee`
- `Tipo` → `Type`
- `Área / puesto` → `Area / position`
- `Alta` → `Hire date`
- `Sueldo ref.` → `Reference salary`
- `Listado de empleados registrados.` / `Readydo de empleados registrados.` → `Registered employee list.`

También se cubren opciones visibles del combo/tipos de empleado:

- `Administrativo` → `Administrative`
- `Entrenador` → `Trainer`
- `Mantenimiento` → `Maintenance`
- `Limpieza` → `Cleaning`
- `Recepción` → `Reception`
- `Administración` → `Administration`

## Nota técnica

Las traducciones se incorporan como exact-only para evitar reemplazos parciales peligrosos y mantener estable el sweep bidireccional.

## Alcance

- Solo frontend/i18n.
- Sin cambios en DB.
- Sin cambios en endpoints.
- Sin cambios en Swagger/OpenAPI.
- Sin cambios en lógica de empleados.
