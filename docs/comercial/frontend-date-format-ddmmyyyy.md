# Fix formato de fechas frontend dd/mm/yyyy

## Objetivo

Estandarizar la presentación de fechas visibles en el frontend de Gym Master para español usando formato `dd/mm/yyyy`.

## Alcance

- Se agregó la utilidad central `src/utils/dateFormat.ts`.
- Se normalizaron fechas visibles en páginas, tablas, modales, componentes de dashboard y PDFs generados desde frontend.
- La base de datos mantiene fechas en formato técnico (`YYYY-MM-DD` / ISO), sin cambios de schema.
- Los inputs `type="date"` conservan el valor técnico requerido por HTML y base de datos.

## Criterio

- Español: `dd/mm/yyyy`.
- Fecha y hora: `dd/mm/yyyy, HH:mm`.
- Hora: `HH:mm:ss`.
- El helper permite pasar otro locale en el futuro para i18n, por ejemplo cuando la UI esté en inglés.

## Archivos clave

- `src/utils/dateFormat.ts`
- `src/components/ui/FechaHora.tsx`
- `src/app/dashboard/compras/page.tsx`
- `src/components/tables/CompraTable.tsx`
- `src/components/modal/CompraViewModal.tsx`
- Componentes, modales y PDFs con fechas visibles.
