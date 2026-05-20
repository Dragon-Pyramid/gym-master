# Pagos Stripe + Webhook

## Objetivo

Esta feature fortalece el flujo de pago online de cuotas mediante Stripe Checkout y su webhook de confirmación.

## Alcance

- Crear sesión de pago con metadata completa.
- Registrar pagos Stripe desde `checkout.session.completed`.
- Guardar `stripe_session_id` y `stripe_payment_intent_id`.
- Evitar duplicados por sesión o payment intent.
- Calcular período cubierto y meses cubiertos.
- Compatibilizar el flujo con la estructura de `pago` incorporada en la foundation de cuotas/pagos.

## Endpoints impactados

- `POST /api/pagar-cuota`
- `POST /api/stripe-webhook`

## Consideraciones

El webhook no debe depender de datos del navegador. El pago se confirma únicamente cuando Stripe envía el evento firmado `checkout.session.completed`.

La validación del evento se hace con `STRIPE_WEBHOOK_SECRET`.

## Pendientes futuros

- Prueba real con Stripe CLI.
- Manejo de eventos fallidos o reembolsados.
- Notificación por email al socio.
- Visualización diferenciada de pagos Stripe en dashboard BI.
