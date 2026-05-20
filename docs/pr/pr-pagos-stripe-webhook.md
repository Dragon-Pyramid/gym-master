# PR: Pagos Stripe + webhook

## Resumen

Este PR fortalece el flujo de pagos online de cuotas mediante Stripe Checkout y webhook de confirmación.

## Cambios principales

- Se actualiza `POST /api/pagar-cuota` para aceptar meses cubiertos opcionales.
- Se actualiza `createSessionPago` para generar metadata completa de pago.
- Se refactoriza `POST /api/stripe-webhook` para registrar pagos con método `stripe`.
- Se agrega control de idempotencia por `stripe_session_id` y `stripe_payment_intent_id`.
- Se guarda período cubierto, vencimiento, meses cubiertos, estado y observación.
- Se agrega script de validación SQL para pagos Stripe.

## Validaciones esperadas

- `npm run build` ejecuta correctamente.
- El endpoint `/api/pagar-cuota` crea sesión Stripe.
- El webhook registra pago solo una vez.
- Los pagos Stripe quedan visibles en `/dashboard/pagos`.
- `obtener_socios_estado_cuota()` refleja correctamente el estado del socio.

## Notas

La validación real del webhook requiere Stripe CLI o un evento real desde Stripe.
