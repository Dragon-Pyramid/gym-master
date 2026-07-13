# I18N ES/EN Socio Dashboard Final Sweep V1 - Evolución Física Fix V4

## Scope

Fixes a TypeScript build error introduced in the translated physical evolution form.

## Route

- `/dashboard/evolucion-fisica`

## Files changed

- `src/components/forms/EvolucionSocioForm.tsx`

## Fix

- Imports `useI18n`.
- Defines local `tx(es, en)` inside `EvolucionSocioForm`.
- Keeps the existing translated labels, validations, placeholders and submit messages.

## Non-goals

- Does not touch DB, endpoints, Swagger/OpenAPI, physical evolution logic, silhouettes, heatmaps, coordinates, animations, PDF/Excel export or RAG logic.
