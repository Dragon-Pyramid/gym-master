# i18n ES/EN commercial stock ledger remaining labels fix v1

## Objetivo
Corregir dos textos restantes visibles en Español dentro de Stock Ledger cuando el idioma activo es Inglés.

## Ajustes
- `Alertas prioritarias de stock` ahora se renderiza mediante `translateCommercialUi`.
- El acceso/botón `Productos` ahora se renderiza mediante `translateCommercialUi`.
- Se asegura que las claves existan en `src/i18n/commercialUi.ts`.

## Alcance
- Solo frontend/i18n.
- No toca DB.
- No toca endpoints.
- No toca Swagger/OpenAPI.
