# Pagos y recibos mobile final polish v1

## Rama

`feature/pagos-recibos-mobile-final-polish-v1`

## Alcance

Pulido final de la experiencia mobile del socio para pagos, recibos e historial de cuota.

## Cambios principales

- Se rediseñó `/dashboard/mi-cuenta/historial-pagos` con header visual, métricas compactas, último comprobante destacado y cards mobile para cada pago.
- Se preservó la tabla desktop del historial para administración visual amplia.
- Se rediseñó `/dashboard/mi-cuenta/pagar-cuota` con estado de cuota, disponibilidad Stripe, selector de meses y resumen de pago más claro en celular.
- Se reforzó contraste para modo claro y modo oscuro.
- Se ajustó el shell vertical `Header / Contenido / Footer` en las páginas del flujo para evitar espacio blanco después del footer al salir de F12 mobile.
- Se refinó la tarjeta `SocioMobilePagosRecibosCard` usada en dashboard socio para evitar compresión en pantallas chicas.

## Archivos modificados

- `src/app/dashboard/mi-cuenta/historial-pagos/page.tsx`
- `src/app/dashboard/mi-cuenta/pagar-cuota/page.tsx`
- `src/components/dashboard/socio/SocioMobilePagosRecibosCard.tsx`

## Validación sugerida

1. Entrar como socio a `/dashboard/mi-cuenta/historial-pagos`.
2. Confirmar cards mobile, tabla desktop y descarga de recibo PDF.
3. Entrar a `/dashboard/mi-cuenta/pagar-cuota`.
4. Confirmar estado de cuota, selector de meses, preview de importe y botón Stripe.
5. Probar modo claro y oscuro.
6. Probar F12 mobile y volver a desktop confirmando que no queda espacio blanco después del footer.
7. Confirmar que no se modificaron endpoints, DB ni Swagger.

## Impacto técnico

No requiere migraciones de base de datos.
No modifica endpoints.
No requiere actualización de Swagger.
