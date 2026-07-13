# I18N ES/EN Socio Dashboard Final Sweep V1 - Evolución Física Fix V3

## Scope
Runtime/build fix for `/dashboard/evolucion-fisica` after the socio physical evolution i18n patch.

## Changes
- Adds `useI18n()` in `EvolucionFisicaRagCoachPanel.tsx`.
- Defines local `isEnglish` and `tx()` helpers used by the RAG Coach panel.
- Keeps the RAG request language as `en` or `es` based on the selected locale.
- Translates minor RAG result labels: `Mode` and `Records analyzed`.

## Not changed
- No DB changes.
- No endpoint changes.
- No Swagger/OpenAPI changes.
- No changes to body silhouette, heatmap, animations, transforms, coordinates or measurements logic.
