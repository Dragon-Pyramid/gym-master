# Gym Master — i18n ES/EN Admin Dashboard Final Sweep v2 — Otros Gastos Fix v2

## Scope
- Route: `/dashboard/otros-gastos`
- Component: receipt upload area in the expense/outflow form.

## Changes
- Replaces the native visible file input with a custom localized upload control.
- Avoids browser/OS native text like `Seleccionar archivo / Sin archivos seleccionados` appearing while the app is in English.
- Adds localized labels:
  - `Seleccionar archivo` -> `Select file`
  - `Sin archivo seleccionado` -> `No file selected`
  - `Subiendo...` -> `Uploading...`

## Safety
- No DB changes.
- No endpoint changes.
- No Swagger/OpenAPI changes.
- No upload logic changes.
- The hidden file input still uses the same `handleFileChange` flow.
