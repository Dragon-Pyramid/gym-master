# Gym Master — i18n ES/EN admin dashboard final sweep v2 — Finanzas / BI fix v1

## Scope
Route: `/dashboard/finanzas`

## Changes
- Translates the fixed UI copy in the Finance / BI screen for ES/EN.
- Fixes header title `Finanzas / BI` -> `Finance / BI` in English.
- Translates hero, date filters, buttons, KPI cards, executive summary, suggested decision, chart titles, legends, empty states, category panels, and the monthly summary table.
- Adds presentation-only translation for known dynamic category labels coming from data/catalogs, such as:
  - `Ventas de productos / kiosco` -> `Product / kiosk sales`
  - `Fees / membresías` -> `Fees / memberships`
  - `Compras a proveedores` -> `Supplier purchases`
  - `Gastos pending` -> `Pending expenses`
  - `Gasto demo ...` -> `Demo expense ...`
  - `Luz` -> `Electricity`
- Improves dark mode locally for cards, KPI blocks, category cards, chart containers, and the monthly table.

## Safety
- No DB changes.
- No endpoint changes.
- No Swagger/OpenAPI changes.
- No finance calculations changed.
- No chart data mapping changed.
- Export/PDF generation logic remains functionally unchanged.
