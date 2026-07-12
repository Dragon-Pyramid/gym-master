# Gym Master — i18n ES/EN Admin Dashboard Final Sweep v2 — Otros Gastos Fix v4

## Alcance
Ruta: `/dashboard/otros-gastos`

## Cambio
- Corrige la descripción dinámica que aparece debajo del combo `Expense type`.
- Las descripciones de catálogo que vienen desde DB en español ahora se traducen en presentación cuando el idioma activo es `en`.

Ejemplo:
- `Gastos asociados a mantenimiento de equipamiento o infraestructura.`
- `Expenses related to equipment or infrastructure maintenance.`

## Seguridad
- No toca DB.
- No toca endpoints.
- No toca Swagger/OpenAPI.
- No cambia lógica de creación/edición de gastos.
- No cambia lógica de comprobantes.
