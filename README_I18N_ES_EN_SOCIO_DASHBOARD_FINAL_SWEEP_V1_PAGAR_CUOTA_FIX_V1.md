# i18n ES/EN socio dashboard final sweep v1 — Pay fee fix v1

## Scope

Screen:

- `/dashboard/mi-cuenta/pagar-cuota`

Files changed:

- `src/app/dashboard/mi-cuenta/pagar-cuota/page.tsx`

## Changes

- Adds locale-aware ES/EN text rendering through `useI18n`.
- Translates the member fee payment hero, Stripe status panel, fee status panel, coverage selector, payment summary, buttons, loading states, empty/unavailable states, and toast fallback messages.
- Translates dynamic fee status labels:
  - `Al día` / `Up to date`
  - `Vencido` / `Overdue`
  - `Sin pagos` / `No payments`
- Translates coverage combo options:
  - `1 mes` / `1 month`
  - `2 meses` / `2 months`
  - `3 meses` / `3 months`
  - `6 meses` / `6 months`
  - `12 meses` / `12 months`
- Translates the advance-payment discount message returned by the payment preview when the UI is in English.
- Keeps the existing dark-mode classes and improves card consistency for the main payment panels.

## Out of scope

- No database changes.
- No API endpoint changes.
- No Swagger/OpenAPI changes.
- No Stripe/payment logic changes.
- No receipt/PDF/export text changes; exportable/printed artifacts remain for the dedicated exportables i18n sweep.

## Validation

Recommended checks:

```bash
npm run build
```

Manual QA:

- Open `/dashboard/mi-cuenta/pagar-cuota` as a member.
- Toggle ES/EN and verify the hero, status card, coverage combo, payment summary, discount message, and buttons.
- Verify light/dark mode.
- Do not perform a real Stripe payment unless using the configured QA/test flow.
