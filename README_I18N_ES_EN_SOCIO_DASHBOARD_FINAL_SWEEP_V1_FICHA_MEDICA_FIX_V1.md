# i18n ES/EN socio dashboard final sweep v1 — ficha médica fix v1

## Scope
- Screen: `/dashboard/ficha-medica`.
- Adds ES/EN presentation i18n for the member medical record page, tabs, current record, new record form, history tab and history detail modal.
- Translates form labels, tabs, empty/loading/error states, upload dropzones, buttons, health disclaimer, validation messages and visible PDF labels.
- Keeps dark mode readable in the new record form, tabs, file upload blocks and history detail modal.

## Files changed
- `src/app/dashboard/ficha-medica/page.tsx`
- `src/components/ficha-medica/Tabs.tsx`
- `src/components/ficha-medica/TabActual.tsx`
- `src/components/ficha-medica/TabNueva.tsx`
- `src/components/ficha-medica/TabHistorial.tsx`
- `src/components/modal/HistorialViewModal.tsx`

## Not touched
- DB schema, API routes, Swagger/OpenAPI, Cloudinary upload logic, medical record persistence, PDF export logic flow, auth, RBAC and sidebar navigation.
