# I18N ES/EN Admin Dashboard Final Sweep v2 - Socios ranking bonificación fix v1

## Scope

Route: `/dashboard/socios-ranking-bonificacion`.

## Changes

- Adds local ES/EN presentation translation through `useI18n`.
- Translates visible EN UI residuals:
  - main title/subtitle
  - KPI cards
  - period/filter card
  - chart card and empty states
  - ranking table headers, statuses, action buttons and pagination
  - commercial rules and backend warnings shown on screen
- Translates export labels for Excel/PDF without changing business calculations.
- Adds dark-mode polishing for KPI cards, panels, table, badges, warnings and rule cards.

## Not changed

- No database changes.
- No API endpoint changes.
- No Swagger/OpenAPI changes.
- No ranking or bonus calculation changes.
