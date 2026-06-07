# Fix — Alineación de tabla en PDF BI Finanzas

## Rama sugerida

`fix/bi-finanzas-pdf-table-alignment`

## Objetivo

Corregir el desfase visual entre encabezados y datos en la tabla del PDF de BI Finanzas.

## Alcance

- Ajusta el render genérico de tablas en `src/utils/commercialReportPdf.ts`.
- Los encabezados respetan la misma alineación configurada por columna.
- Cada celda se dibuja con borde individual para que la relación encabezado/dato sea clara.
- Se evita que valores largos invadan visualmente columnas vecinas.
- No modifica base de datos, APIs, Swagger ni reglas de negocio.

## Validación recomendada

1. Entrar a `/dashboard/finanzas`.
2. Generar PDF de BI Finanzas.
3. Verificar que las columnas `Período`, `Ingresos`, `Egresos`, `Resultado`, `Cuotas`, `Ventas`, `Compras` y `Gastos` queden alineadas con sus datos.
4. Ejecutar `npm run build`.
5. Restaurar `public/sw.js` y `public/workbox-*` si cambian sin intención.
