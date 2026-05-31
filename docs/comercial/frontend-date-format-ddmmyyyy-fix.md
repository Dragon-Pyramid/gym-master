# Fix frontend date format dd/mm/yyyy

## Objetivo

Ajustar renderizados visibles que todavía mostraban fechas ISO (`yyyy-mm-dd`) en tablas y modales del frontend.

## Alcance

- Detalle de producto: historial de precios/costos y movimientos de stock.
- Listado de cuotas.
- Detalle de cuota.
- Exportación PDF/Excel de cuotas.
- Historial de dietas.
- Tabla legacy de rutinas.

## Criterio

- Las fechas visibles al usuario en español deben mostrarse como `dd/mm/yyyy`.
- Los inputs HTML `type=date` y los payloads hacia backend/base de datos mantienen `yyyy-mm-dd`.
- No se modifica base de datos.
