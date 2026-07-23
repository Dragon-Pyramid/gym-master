# Gym Master — i18n ES/EN Final QA v1

## Hotfix v4d — Purchase status and item actions

### Context

During the English QA pass of `/dashboard/compras`, the new purchase/replenishment form still displayed two system-controlled labels in Spanish:

- `Pagada / recibida` in the purchase status selector.
- `Agregar ítem` in the purchased-products block.

The icon-only remove action also exposed the Spanish tooltip `Quitar ítem`.

### Root cause

The form already routed most labels through `translateCommercialUi`, but:

1. `Pagada / recibida` did not exist in the English commercial catalog.
2. The add-item button and remove-item tooltip bypassed the translation helper.

### Changes

- Added `Pagada / recibida → Paid / received` to the commercial ES/EN catalog.
- Routed `Agregar ítem` through `translateCommercialUi`.
- Routed the `Quitar ítem` tooltip through `translateCommercialUi`.

### Persistence and business rules

- The persisted purchase status remains `pagada` or `pendiente`.
- No database values, DTOs, APIs, stock rules, totals or purchase logic were changed.
- Supplier names, invoice numbers, notes and other customer-entered data remain in their original language.

### Expected result

In English:

- `Paid / received`
- `Pending`
- `Add item`
- `Remove item`

In Spanish:

- `Pagada / recibida`
- `Pendiente`
- `Agregar ítem`
- `Quitar ítem`

### Files

- `src/components/forms/CompraForm.tsx`
- `src/i18n/commercialUi.ts`

### QA

- Change locale EN → ES → EN without closing the modal.
- Confirm both status options update immediately.
- Confirm the add-item label and remove-item tooltip update immediately.
- Create a QA purchase and verify the stored status and stock behavior are unchanged.
