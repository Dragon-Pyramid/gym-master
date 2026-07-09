# i18n ES/EN commercial final sweep build fix v1

## Objetivo
Corregir el build de `feature/i18n-es-en-commercial-final-sweep-v1`.

## Problema
`src/app/dashboard/ventas/page.tsx` usaba `c('Período: todos')` dentro de `getDateRangeLabel()`, una función definida fuera del componente React. Como `c` se declara dentro del componente mediante `useI18n()`, TypeScript no podía resolver el nombre.

## Ajuste
- `getDateRangeLabel()` ahora recibe `c` como parámetro.
- La llamada desde el PDF/export usa `getDateRangeLabel(dateFrom, dateTo, c)`.
- Se aseguran claves de traducción relacionadas con filtros y períodos.

## Alcance
- Solo frontend/i18n.
- No toca DB.
- No toca endpoints.
- No toca Swagger/OpenAPI.
