# Corrección del modal de detalle de pagos

## Contexto

Durante la validación funcional de `feature/pagos-manuales-admin`, el modal de detalle del pago mostraba UUIDs internos para socio, cuota y usuario registrador.

## Problema detectado

La tabla de pagos ya recibía objetos enriquecidos desde la API (`socio`, `cuota`, `registrado_por`), pero la página transformaba el pago seleccionado al formato legacy `Pago`, reemplazando esos objetos por ids.

Como consecuencia, el modal mostraba datos técnicos en lugar de información legible para administración.

## Solución aplicada

- `PagoViewModal` ahora recibe `ResponsePago` directamente.
- La página `/dashboard/pagos` pasa `pagoVer` sin transformar.
- El modal muestra:
  - nombre del socio,
  - descripción de la cuota,
  - fecha de pago,
  - vencimiento,
  - período cubierto,
  - meses cubiertos,
  - monto pagado,
  - total,
  - método de pago,
  - estado,
  - usuario registrador,
  - referencias Stripe si existen,
  - observaciones si existen.

## Resultado esperado

El administrador ve información clara de negocio, no identificadores internos.
