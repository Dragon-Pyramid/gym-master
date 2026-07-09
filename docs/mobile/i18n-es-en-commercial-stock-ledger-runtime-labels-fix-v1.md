# Gym Master – Stock Ledger runtime labels i18n fix v1

## Objetivo
Completar la traducción ES/EN de valores dinámicos visibles en `Stock Ledger` cuando el idioma activo es Inglés.

## Problema
La UI ya tenía varias etiquetas traducidas, pero seguían apareciendo textos cargados desde datos/runtime en Español, por ejemplo:

- `compra`, `venta`
- `Cantidad`
- `Sin origen`, `Sin destino`
- `Depósito`, `Recepción`, `Heladera`, `Vitrina`, `Sala profesores`
- descripciones de ubicaciones
- motivos generados como `Reposición sugerida por alerta bajo mínimo · 7 unidades`
- referencias como `Recepción orden de compra ...` o `Venta POS/Kiosco ...`

## Ajuste
Se agregó una capa de normalización visual en `stock-ledger/page.tsx` para traducir valores de negocio sin modificar datos persistidos.

## Alcance
- Solo frontend/presentación.
- No modifica DB.
- No modifica endpoints.
- No modifica Swagger/OpenAPI.
- No cambia datos reales guardados en Supabase.
