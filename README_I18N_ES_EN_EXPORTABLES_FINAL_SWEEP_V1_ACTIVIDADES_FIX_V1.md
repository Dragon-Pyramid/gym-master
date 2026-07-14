# I18N ES/EN Exportables Final Sweep V1 — Actividades Fix V1

Corrige exportables del módulo `dashboard/actividades` para que PDF y Excel respeten el idioma activo.

## Alcance

- PDF: título, subtítulo, fecha `Generated/Generado`, KPIs, filtros, detalle, columnas, empty state, footer y paginación.
- Excel: nombres de hojas, headers, filename y valores de presentación frecuentes.
- Normalización de valores visibles en EN: días, estados, actividad/turno/ubicación/instructor cuando corresponda.
- Refuerzo del helper `downloadCommercialReportPdf` para aceptar `locale` y labels ES/EN si la rama todavía no lo tenía.

## Fuera de alcance

- No toca DB, endpoints, Swagger/OpenAPI, lógica de turnos, cupos, inscripciones ni cálculos de ocupación.
- No traduce datos persistidos de clientes de forma estructural; solo presentación del exportable.

## Aplicación

```bash
node scripts/fix-actividades-exportables-i18n-v1.cjs
rm -rf .next
npm run build
```
