# Gym Master — Admin Dashboard Final Sweep v2 — Pagos i18n/dark fix v1

## Alcance
Ruta: `/dashboard/pagos`

## Cambios
- Traducción ES/EN de UI fija de pagos:
  - header, título, subtítulo y filtros.
  - botones de PDF, Excel y pago manual.
  - tabla de pagos, footer, caption y paginación.
  - modal de alta/edición de pago.
  - formulario de pago manual.
  - modal de detalle de pago.
- Traducción de presentación para estados y métodos comunes:
  - `pagado` -> `Paid`
  - `pendiente` -> `Pending`
  - `cancelado` -> `Canceled`
  - `efectivo` -> `Cash`
  - `transferencia` -> `Bank transfer`
- Mejora puntual de dark mode:
  - card principal de pagos.
  - tabla y hover de filas.
  - botones de exportación en dark.
  - modales de pago/detalle.
  - panel de descuentos del formulario.

## Seguridad
- No toca DB.
- No toca endpoints.
- No toca Swagger/OpenAPI.
- No cambia lógica de pagos, Stripe, descuentos ni recibos.
- No cambia PDF/Excel estructuralmente; solo labels de presentación según idioma activo.
