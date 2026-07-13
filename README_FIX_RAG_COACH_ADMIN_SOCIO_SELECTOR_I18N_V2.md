# Fix RAG Coach admin socio selector i18n v2

## Objetivo
Corregir textos residuales en español/mix ES-EN dentro del selector de socio del Coach IA cuando la interfaz está en inglés.

## Archivo modificado
- `src/app/dashboard/coach/page.tsx`

## Cambios
- Agrega lectura de `locale` mediante `useI18n` en la pantalla del Coach IA.
- Traduce ES/EN el bloque administrativo de selección de socio:
  - Socio operativo del Coach IA / Operational member for AI Coach
  - Como administrador... / As an administrator...
  - Buscar socio... / Search member...
  - Seleccionar socio... / Select a member...
  - Sin socio seleccionado / No member selected
  - Sin selección... / Without a selected member...
  - Limpiar selección / Clear selection
- Traduce también textos del hero y contadores superiores para evitar mezclas visibles.

## Alcance
- No toca DB.
- No agrega endpoints.
- No modifica Swagger/OpenAPI.
- No cambia la lógica de selección de socio ni la generación de dietas/rutinas/evolución.
- Mantiene el comportamiento seguro: admin sin socio seleccionado no ejecuta acciones automáticas.
