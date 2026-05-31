# Fix frontend — Compras, gastos y descargas PDF

## Rama

`feature/compras-proveedores-stock`

## Alcance

Se incorporaron ajustes de QA detectados durante la validación funcional del circuito comercial:

- Filtro adicional por rango de fecha `desde` / `hasta` en `QA: src/app/dashboard/otros-gastos/page.tsx`.
- Card de acceso directo a `Gastos / Egresos` desde `QA: src/app/dashboard/comercial/page.tsx`.
- Helper central para nombres de archivos descargables con timestamp.
- PDFs generados desde frontend con nombre en formato:

```txt
YYYYMMDD-HHMM-tipo-de-documento.pdf
```

## Criterios

- La base de datos mantiene las fechas en formato técnico.
- Los inputs `type="date"` conservan `YYYY-MM-DD` porque es requerido por HTML.
- La presentación visible y reportes usan formato de frontend consistente.
- Los PDFs descargados quedan trazables por fecha, hora y tipo de reporte.

## Archivos principales

- `src/app/dashboard/otros-gastos/page.tsx`
- `src/app/dashboard/comercial/page.tsx`
- `src/utils/downloadFileName.ts`
- `src/utils/commercialReportPdf.ts`
- `src/utils/dietaPdf.ts`
- `src/utils/rutinaPdf.ts`
- `src/utils/evolucionFisicaPdf.ts`
- `src/utils/pagoReciboPdf.ts`
- `src/app/dashboard/dietas/page.tsx`
- `src/components/modal/DietasViewModal.tsx`
- `src/components/modal/RutinaModalView.tsx`
