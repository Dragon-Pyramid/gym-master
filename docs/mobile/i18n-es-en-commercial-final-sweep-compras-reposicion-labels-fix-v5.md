# i18n ES/EN commercial final sweep compras-reposicion labels fix v5

## Objetivo
Corregir textos restantes visibles en Español dentro de `/dashboard/comercial/compras-reposicion` cuando el idioma activo es Inglés.

## Ajustes
- `Recibir cantidades` ahora pasa por `translateCommercialUi` y se muestra como `Receive quantities`.
- Se cubren labels cercanos del bloque de órdenes abiertas y recepción:
  - `Órdenes abiertas y recepción`
  - `Órdenes recientes`
  - `Destino`
  - `Depósito`
  - estados runtime como `Pendiente`, `Parcial`, `Recibida`, `Recibido`, `Cancelada`.

## Alcance
- Solo frontend/i18n.
- No toca DB.
- No toca endpoints.
- No toca Swagger/OpenAPI.
