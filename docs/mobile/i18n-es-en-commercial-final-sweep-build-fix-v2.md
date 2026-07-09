# i18n ES/EN commercial final sweep build fix v2

## Objetivo
Corregir el build de `feature/i18n-es-en-commercial-final-sweep-v1`.

## Problema
El barrido final agregó `c(...)` en dos forms comerciales, pero esos componentes no tenían declarado el helper `c` ni los imports de i18n.

## Ajustes
- `src/components/forms/CompraForm.tsx`
  - Agrega `useI18n`.
  - Agrega `translateCommercialUi`.
  - Declara `const c = (...)` dentro del componente.

- `src/components/forms/ProductoStockMovimientoForm.tsx`
  - Agrega `useI18n`.
  - Agrega `translateCommercialUi`.
  - Declara `const c = (...)` dentro del componente.

## Alcance
- Solo frontend/i18n.
- No toca DB.
- No toca endpoints.
- No toca Swagger/OpenAPI.
