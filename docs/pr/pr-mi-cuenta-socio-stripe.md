# PR: Agregar Mi cuenta del socio para pago Stripe e historial de pagos

## Resumen

Este PR corrige la experiencia de cuotas para socios, separando el listado administrativo de precios de cuota del flujo real del socio.

La opción anterior exponía el listado de evolución de cuotas dentro del menú del socio. Ahora se incorpora una sección específica **Mi cuenta**, con dos subopciones orientadas al uso real del socio:

- **Pagar cuota**: inicia el checkout de Stripe.
- **Historial de pagos**: lista los pagos propios del socio.

## Cambios principales

- Se agrega sección `Mi cuenta` en el sidebar.
- Se agregan rutas:
  - `/dashboard/mi-cuenta/pagar-cuota`
  - `/dashboard/mi-cuenta/historial-pagos`
- Se remueve `Cuota - Precio` del menú del socio.
- Se crea endpoint `GET /api/mi-cuenta/pagos`.
- Se ajusta `POST /api/pagar-cuota` para uso exclusivo de socios.
- Se mantiene el pago en efectivo como operación administrada desde el panel de administración.

## Validaciones sugeridas

- Login como socio.
- Ver menú `Mi cuenta`.
- Ingresar a `Pagar cuota`.
- Iniciar pago con Stripe.
- Ingresar a `Historial de pagos`.
- Confirmar que solo se ven pagos propios.
- Login como admin.
- Confirmar que `Cuotas` sigue disponible como administración de precios.

## Notas

Esta mejora forma parte de la feature `feature/pagos-stripe-webhook`, porque conecta el flujo de pago online del socio con el checkout de Stripe.
