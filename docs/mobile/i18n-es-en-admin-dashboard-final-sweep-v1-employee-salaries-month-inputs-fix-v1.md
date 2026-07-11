# i18n ES/EN admin dashboard final sweep v1 — Employee salaries month inputs fix v1

## Objetivo

Corregir un remanente visual en `/dashboard/empleados-sueldos` cuando la interfaz está en Inglés: los dos filtros de período mostraban el separador nativo del navegador en Español (`de`) dentro del control `input[type="month"]`.

## Alcance

- Se mantiene el filtro por período desde/hasta.
- En Español se conserva el input nativo `type="month"`.
- En Inglés se evita el placeholder nativo del navegador y se usa un campo de texto controlado con formato `YYYY-MM`.
- Se agregan placeholders claros:
  - `From period (YYYY-MM)`
  - `To period (YYYY-MM)`
- Se conserva el valor interno `YYYY-MM`, por lo que no cambia la lógica de filtrado.

## Archivos modificados

- `src/app/dashboard/empleados-sueldos/page.tsx`

## Sin impacto

No toca:

- DB.
- Migraciones.
- Endpoints.
- Swagger/OpenAPI.
- Permisos/RBAC.
- PDF/Excel.
- Modal de sueldos.

## QA sugerido

1. Entrar como administrador a `/dashboard/empleados-sueldos`.
2. Cambiar idioma a Inglés.
3. Confirmar que los filtros de período ya no muestran `de`.
4. Confirmar que muestran:
   - `From period (YYYY-MM)`
   - `To period (YYYY-MM)`
5. Escribir valores como `2026-06` y validar que el filtro sigue funcionando.
6. Cambiar a Español y confirmar que el input mensual nativo sigue funcionando.
7. Probar modo claro/oscuro, desktop y F12 mobile.
