# Mi cuenta del socio: pago de cuota e historial

## Objetivo

Se corrige la experiencia del socio respecto a cuotas y pagos.

La pantalla `/dashboard/cuotas` corresponde al listado administrativo de evolución/precio de cuotas y no debe exponerse como opción principal del socio. Para el socio se incorpora una sección específica **Mi cuenta**, con dos opciones:

- **Pagar cuota**: inicia un pago online con Stripe.
- **Historial de pagos**: muestra los pagos propios del socio, incluyendo pagos mensuales, pagos adelantados, pagos en efectivo cargados por administración y pagos Stripe.

## Cambios principales

- Se agrega una sección `Mi cuenta` al sidebar.
- Se remueve la opción `Cuota - Precio` del menú permitido para socios.
- Se agrega `/dashboard/mi-cuenta/pagar-cuota`.
- Se agrega `/dashboard/mi-cuenta/historial-pagos`.
- Se agrega `GET /api/mi-cuenta/pagos` para que el socio consulte únicamente sus pagos.
- Se asegura que `POST /api/pagar-cuota` sea un flujo exclusivo para socios.
- Se conserva el flujo de pago manual en efectivo desde administración.

## Reglas funcionales

- El socio no paga en efectivo desde su panel.
- El pago en efectivo se realiza al administrador, quien lo registra desde el módulo de pagos.
- El socio puede pagar online mediante Stripe.
- El historial de pagos se filtra por el socio autenticado.
- El socio no puede consultar pagos de otros socios.

## Validación recomendada

1. Iniciar sesión como socio.
2. Verificar que en el menú lateral aparezca `Mi cuenta`.
3. Verificar que existan las opciones `Pagar cuota` e `Historial de pagos`.
4. Confirmar que ya no aparezca `Cuota - Precio` para el socio.
5. Entrar a `Pagar cuota` y validar el estado actual de cuota.
6. Seleccionar meses cubiertos e iniciar Stripe Checkout.
7. Entrar a `Historial de pagos` y verificar pagos propios.
8. Iniciar sesión como admin y confirmar que el módulo `Cuotas` sigue disponible como administración de precios.

## Alcance pendiente

- Validación completa con Stripe CLI y webhook local.
- Mejora visual de pago exitoso/fallido para volver a `Mi cuenta`.
- Eventual PDF/recibo de pago para socios.
