# Gym Master — i18n ES/EN Admin Dashboard Final Sweep v2 — Otros gastos fix v1

## Alcance
Ruta: `/dashboard/otros-gastos`

## Cambios
- Traducción ES/EN de labels, filtros, botones, tabla, footer/paginación, modal de alta/edición y modal de detalle.
- Traducción de presentación para estados, medios de pago y textos demo/semilla visibles como `Gasto demo`, `Sin clasificar`, `Comp.`.
- Mejora puntual de dark mode local: cards KPI, tabla, badges de estado, panel informativo y modales.
- Agrega iconos mnemotécnicos en cards KPI superiores.
- No toca DB, endpoints, Swagger/OpenAPI ni lógica de gastos/comprobantes.

## Archivos
- `src/app/dashboard/otros-gastos/page.tsx`
- `src/components/tables/OtrosGastosTable.tsx`
- `src/components/modal/OtrosGastosModal.tsx`
- `src/components/modal/OtrosGastosViewModal.tsx`
- `src/components/forms/OtrosGastosForm.tsx`
- `src/utils/otrosGastosI18n.ts`
