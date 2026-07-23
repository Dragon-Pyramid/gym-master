# i18n ES/EN final QA — Service form labels and core options hotfix v4f

## Scope

Surgical correction for `/dashboard/servicios` when the active locale is English.

## Fixed UI

- `Generar` button now uses the commercial translation catalog.
- Commercial-code helper text now follows the active locale.
- Service category options now render through the ES/EN catalog.
- Service modality options now render through the ES/EN catalog.
- Booking and future online-sale checkbox labels now follow the locale.
- Example placeholders now use `Ex:` in English.

## Persistence contract

The persisted values remain unchanged (`personal_trainer`, `evaluacion`, `nutricion`, `clase_especial`, `pase`, `alquiler`, `premium`, `otro`, `presencial`, `online`, `mixto`). Only their user-facing labels are localized. Names, descriptions, observations and other gym-entered data are not translated automatically.

## Files

- `src/components/forms/ServicioForm.tsx`
- `src/i18n/commercialUi.ts`

## Out of scope

No database, migration, RLS, RPC, API, DTO, authorization or commercial-rule changes.
