# Socio mobile pagos y recibos card v1

## Rama

`feature/socio-mobile-pagos-recibos-card-v1`

## Objetivo

Agregar una tarjeta mobile para que el socio consulte desde el dashboard el estado de cuota, el último pago registrado, el historial de pagos y la descarga del último recibo PDF.

## Alcance

- Frontend mobile del socio.
- Sin cambios de base de datos.
- Sin cambios backend.
- Reutiliza `/api/mi-cuenta/pagos` para consultar pagos del socio autenticado.
- Reutiliza el estado de cuota ya cargado por el dashboard.
- Reutiliza `descargarPagoReciboPdf` para generar el comprobante PDF del último pago.

## Archivos modificados

- `src/components/dashboard/DashboardInitialContent.tsx`
- `src/components/dashboard/socio/SocioMobilePagosRecibosCard.tsx`
- `docs/mobile/socio-mobile-pagos-recibos-card-v1.md`

## Comportamiento

La tarjeta muestra:

- Estado de cuota.
- Próximo vencimiento o fecha límite de pago.
- Monto adeudado si corresponde.
- Último pago registrado.
- Cantidad de pagos históricos.
- Total histórico abonado.
- Acceso a pagar cuota.
- Acceso al historial de pagos.
- Botón para descargar el último recibo PDF.

## Estados contemplados

- Cuota al día.
- Cuota pendiente o vencida.
- Historial de pagos disponible.
- Sin pagos registrados.
- Error de consulta del historial.
- Descarga de recibo en proceso.

## QA sugerido

1. Entrar como socio desde Android o emulación mobile.
2. Abrir `/dashboard`.
3. Validar la tarjeta `Pagos y recibos`.
4. Verificar estado de cuota y vencimiento.
5. Verificar último pago si existe.
6. Abrir historial de pagos.
7. Abrir pagar cuota.
8. Descargar último recibo PDF si hay pagos registrados.
9. Confirmar que admin y usuario interno no ven la tarjeta mobile del socio.
10. Confirmar que no se altera el layout desktop.
