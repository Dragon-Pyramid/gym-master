# Informe ejecutivo: Mi cuenta del socio para pagos

## Proyecto

Gym Master

## Rama

`feature/pagos-stripe-webhook`

## Objetivo

Corregir el flujo de cuotas visible para socios, reemplazando el listado administrativo de evolución de cuotas por una sección funcional orientada a la cuenta personal del socio.

## Resultado

Se incorpora la sección **Mi cuenta** en el menú del socio, con acceso directo a:

- **Pagar cuota**, para iniciar un pago online vía Stripe.
- **Historial de pagos**, para revisar pagos mensuales, pagos adelantados, pagos en efectivo registrados por administración y pagos Stripe.

## Impacto funcional

El socio deja de ver la pantalla administrativa de precios de cuota como opción principal. En su lugar, obtiene una experiencia orientada a su operación real: pagar online y consultar su propio historial.

El administrador mantiene el control del pago en efectivo desde el módulo de pagos, preservando la trazabilidad operativa.

## Beneficios

- Mejor separación entre experiencia del socio y administración.
- Menor confusión en el menú lateral.
- Flujo de pago online más claro.
- Historial de pagos propio para el socio.
- Base preparada para recibos, comprobantes y futuras mejoras de cuenta.

## Validaciones recomendadas

- Login socio.
- Menú Mi cuenta visible.
- Cuota - Precio no visible para socio.
- Pagar cuota redirige a Stripe Checkout.
- Historial de pagos muestra solo pagos del socio autenticado.
- Login admin mantiene módulos administrativos.
