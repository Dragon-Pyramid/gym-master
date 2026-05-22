# Fix PDF biométrico - jsPDF arc

## Problema

El build fallaba porque `doc.arc()` no existe en los tipos TypeScript de `jsPDF`.

## Solución

Se reemplazaron los trazos de íconos que usaban `arc()` por primitivas soportadas por jsPDF:

- `circle()`
- `roundedRect()`
- `line()`
- `text()`

## Alcance

- No cambia base de datos.
- No cambia APIs.
- No cambia el flujo de descarga.
- Solo corrige compatibilidad de tipos en `src/utils/evolucionFisicaPdf.ts`.
