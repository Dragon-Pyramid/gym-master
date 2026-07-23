# i18n ES/EN Final QA v1 — Commercial, payments and reports — Batch v4

## Objective

Close the final ES/EN QA pass for Gym Master's commercial and financial operating flow without translating customer-entered business data and without changing persistence, authorization, or business contracts.

## Covered areas

- Commercial executive dashboard.
- POS / Kiosk and printable sales ticket.
- Cash register opening, movements, closing and printable X/Z report.
- Stock Ledger, physical count, transfers, shrinkage and replenishment.
- Products, stock thresholds, price/cost history and movement history.
- Suppliers, purchases and purchase replenishment.
- Sellable services, commercial packs and pack analytics.
- QR/barcode commercial labels and printable sheets.
- Sales, sale details and printable/exportable reports.
- Fees, payments, payment receipts and operational BI.
- Financial BI, monthly results and PDF/Excel exports.

## Main changes

- Extended `formatCurrencyARS` with an optional ES/EN locale while preserving Spanish as the safe default.
- Localized currency, dates and times in UI, PDF/Excel values, tickets, labels and cash reports.
- Completed missing translations in inherited forms, tables, modals, loading, empty, confirmation, success and error states.
- Added ES/EN support to the legacy sale-detail and fee/payment BI views.
- Corrected the printable cash report so translated expressions are rendered instead of appearing as literal template text.
- Localized payment methods, commercial statuses, stock movement types, supplier states and other system-owned catalog values.
- Preserved product names, service names, supplier data, sale notes, payment notes and other customer-entered content in its original language.
- Removed accidental translation attempts on service names and descriptions entered by the gym.

## Shared or cross-cutting files

- `src/i18n/commercialUi.ts`
- `src/lib/comercial/productos.ts`

The shared changes are limited to commercial text resolution and locale-aware ARS formatting. The default behavior remains Spanish when no valid locale is supplied.

## Explicitly unchanged

- Database schema and data.
- Supabase migrations.
- RLS policies and RPC functions.
- Storage configuration.
- Authentication and authorization.
- API response shapes and persisted commercial values.
- Stripe business logic.
- Stock, cash, sales, payment and cancellation rules.

## Static validation completed

- All modified TypeScript and TSX files parse successfully.
- No selected semantic diagnostics for undefined identifiers or incompatible calls.
- All direct commercial translation keys used by the patch exist in the English catalog.
- The commercial translation object has no duplicate keys.
- No fixed `es-AR` formatter remains in the audited commercial, fees or payments scope.
- No SQL, migration, backup, environment or generated PWA file is included.

## Required local validation

1. Run `npm run build`.
2. Restore generated PWA files.
3. Test each route in Spanish and English.
4. Verify mobile, desktop and dark mode.
5. Check browser console and network requests.
6. Perform modifying operations only with local or QA data.

## Suggested routes

- `/dashboard/comercial`
- `/dashboard/comercial/kiosco`
- `/dashboard/comercial/caja`
- `/dashboard/comercial/stock-ledger`
- `/dashboard/comercial/compras-reposicion`
- `/dashboard/comercial/servicios-promociones`
- `/dashboard/comercial/pack-analytics`
- `/dashboard/comercial/codigos-etiquetas`
- `/dashboard/productos`
- `/dashboard/proveedores`
- `/dashboard/servicios`
- `/dashboard/compras`
- `/dashboard/ventas`
- `/dashboard/ventas-detalle`
- `/dashboard/cuotas`
- `/dashboard/pagos`
- `/dashboard/bi-cuotas-pagos`
- `/dashboard/finanzas`
