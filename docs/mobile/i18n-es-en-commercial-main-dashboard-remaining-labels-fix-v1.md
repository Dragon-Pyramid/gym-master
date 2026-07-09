# i18n ES/EN commercial main dashboard remaining labels fix v1

## Objetivo
Corregir textos restantes visibles en Español dentro de `/dashboard/comercial` cuando el idioma activo es Inglés.

## Ajustes
- `Panel comercial final` ahora se renderiza mediante `translateCommercialUi`.
- `Radar comercial operativo` ahora se renderiza mediante `translateCommercialUi`.
- `Lectura ejecutiva comercial` ahora se renderiza mediante `translateCommercialUi`.
- Se cubren además labels cercanos del mismo dashboard: `Stock`, `Gestionar stock` y `Calculando...`.

## Alcance
- Solo frontend/i18n.
- No toca DB.
- No toca endpoints.
- No toca Swagger/OpenAPI.
