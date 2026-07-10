# i18n navigation menus final sweep v23 - Employees loading locale fix

## Objetivo

Corregir el loading temprano de `/dashboard/empleados` cuando el idioma activo es Inglés.

## Problema

El texto `Cargando empleados...` se renderiza en un return temprano:

```tsx
if (loading || !isInitialized) {
  return <div> Cargando empleados... </div>;
}
```

Ese return ocurre antes de que el contenido completo de la pantalla esté disponible, por lo que no conviene depender del `DashboardInlineI18nSweep`.

## Ajuste quirúrgico

Se incorpora `useI18n()` directamente en `src/app/dashboard/empleados/page.tsx` y el loading queda condicionado por idioma:

- EN: `Loading employees...`
- ES: `Cargando empleados...`

## Alcance

- Solo frontend.
- Solo `/dashboard/empleados/page.tsx`.
- Sin cambios en DB.
- Sin cambios en endpoints.
- Sin cambios en Swagger/OpenAPI.
- Sin cambios en lógica de empleados.
- Sin cambios en layout.
