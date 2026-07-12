# Gym Master — Admin dashboard i18n ES/EN final sweep v2 — Otros gastos fix v6

## Scope
Route: `/dashboard/otros-gastos`

Incremental fix over `otros_gastos_fix_v5`.

## What changed
- Extends the expense type description resolver so the dynamic helper text under `Expense type` is translated for all known catalog options.
- Adds exact and defensive translations for descriptions such as:
  - `Gastos no clasificados.` -> `Unclassified expenses.`
  - `Pagos mensuales a empleados.` -> `Monthly payments to employees.`
  - `Pagos a empleados.` -> `Payments to employees.`
- Keeps existing translations for maintenance, services, supplies, rent, taxes, cleaning, marketing and other operational categories.

## Safety
- No DB changes.
- No endpoint changes.
- No Swagger/OpenAPI changes.
- No business logic changes.
- Only presentation/i18n helper changed.

## Modified files
- `src/utils/otrosGastosI18n.ts`
