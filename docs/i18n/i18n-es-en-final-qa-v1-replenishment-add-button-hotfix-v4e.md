# i18n ES/EN final QA — Replenishment Add button hotfix v4e

## Context

During the English QA pass of `/dashboard/comercial/compras-reposicion`, the action button in each suggested-replenishment card still displayed the Spanish literal `Agregar`.

## Root cause

The page already used the centralized `translateCommercialUi(locale, text)` helper and the commercial catalog already contained the mapping `Agregar` → `Add`. However, this specific button rendered the literal directly instead of calling the local `c(...)` translator.

## Change

- Replaced the hardcoded `Agregar` label with `c('Agregar')`.
- No new translation key was required.
- All suggested-replenishment cards now react immediately to ES/EN locale changes.

## Scope

Modified functional file:

- `src/app/dashboard/comercial/compras-reposicion/page.tsx`

## Persistence and business rules

This change affects presentation only. It does not modify products, suppliers, suggested quantities, purchase orders, stock, APIs, database structures, migrations, RLS, RPCs, or authorization.

## Expected result

- Spanish: `Agregar`
- English: `Add`

## QA

1. Open `/dashboard/comercial/compras-reposicion` in English.
2. Confirm every suggested-replenishment card shows `Add`.
3. Change EN → ES → EN without reloading.
4. Confirm the labels update immediately.
5. Click `Add` and verify the suggested product is inserted into the new purchase order without regression.
