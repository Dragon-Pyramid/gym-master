# fix: show readable payment details in admin modal

## Resumen

Este ajuste corrige el modal de detalle de pagos del panel administrador para mostrar datos legibles en lugar de UUIDs internos.

## Problema

Al presionar **Ver** sobre un pago, el modal mostraba ids técnicos para socio, cuota y usuario registrador. Esto dificultaba la validación administrativa del pago y generaba una mala experiencia de uso.

## Cambios realizados

- Se actualizó `PagoViewModal` para consumir `ResponsePago` directamente.
- Se eliminó la transformación legacy del pago seleccionado en `/dashboard/pagos`.
- El modal ahora muestra nombre del socio, cuota, fechas, cobertura, método, estado, montos, registrador y datos Stripe cuando existan.
- Se agregó documentación técnica del ajuste.

## Validación sugerida

1. Iniciar sesión como administrador.
2. Entrar a `/dashboard/pagos`.
3. Presionar **Ver** en un pago QA o real.
4. Confirmar que el modal muestra nombres/descripciones y no UUIDs.
5. Ejecutar `npm run build`.

## Alcance

Este cambio no modifica base de datos ni migraciones. Es un ajuste de presentación y tipado frontend sobre la respuesta ya enriquecida de la API.
