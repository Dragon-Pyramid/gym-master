# i18n ES/EN commercial modules build fix v1

## Objetivo
Corregir el build de `feature/i18n-es-en-commercial-modules-v1` luego de la primera pasada i18n comercial.

## Ajuste
- Se agregó el import faltante de `useI18n` en `src/app/dashboard/comercial/pack-analytics/page.tsx`.
- Se agregó el import faltante de `translateCommercialUi` en la misma página.

## Alcance
No toca DB, endpoints, permisos, rutas ni Swagger/OpenAPI.
