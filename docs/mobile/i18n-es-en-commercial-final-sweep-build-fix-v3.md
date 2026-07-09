# i18n ES/EN commercial final sweep build fix v3

## Objetivo
Corregir el build de `feature/i18n-es-en-commercial-final-sweep-v1`.

## Problema
`src/i18n/commercialUi.ts` tenía claves repetidas dentro del object literal de traducciones. TypeScript bloquea el build cuando detecta propiedades duplicadas.

## Ajuste
- Se limpian claves duplicadas del mapper `commercialUi.ts`.
- Se conserva la última traducción declarada para cada clave.
- Se evita que el build siga fallando uno por uno por claves repetidas.

## Duplicados detectados antes del fix
- `Búsqueda`
- `Filtro`
- `Período: todos`

## Duplicados después del fix
- Ninguno detectado en entradas simples del mapper.

## Alcance
- Solo frontend/i18n.
- No toca DB.
- No toca endpoints.
- No toca Swagger/OpenAPI.
