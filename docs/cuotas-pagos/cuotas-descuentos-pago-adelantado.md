# Cuotas — Descuentos por pago adelantado

**Feature:** `feature/cuotas-descuentos-pago-adelantado`  
**Fecha:** 2026-05-26

## Objetivo

Permitir configurar un descuento administrativo para socios que pagan varias cuotas por adelantado, aplicable tanto a pagos manuales como a Stripe.

## Alcance

- Nueva parametrización en `Parametrización → Descuento por pago adelantado`.
- Nueva tabla `public.cuota_descuento_config`.
- Nuevos snapshots en `public.pago`:
  - `subtotal`
  - `descuento_porcentaje`
  - `descuento_monto`
  - `descuento_motivo`
- Cálculo automático en pago manual.
- Vista previa de total a pagar en pago Stripe del socio.
- Metadata Stripe con subtotal/descuento/total.
- Webhook Stripe persistiendo el descuento aplicado.
- Recibos PDF e historial mostrando descuento cuando existe.
- BI y exportación administrativa contemplando descuento.

## Regla funcional

Si el parámetro está desactivado o con porcentaje `0`:

- no se aplica descuento;
- no se altera el flujo histórico;
- el total final coincide con el subtotal.

Si el parámetro está activo y el socio paga al menos la cantidad mínima de cuotas:

- se calcula subtotal = cuota vigente × meses cubiertos;
- se calcula descuento = subtotal × porcentaje / 100;
- se calcula total final = subtotal - descuento;
- se guardan los valores como snapshot en `pago`.

## Validación

Script:

```bash
docker exec -i supabase_db_gym-master psql -U postgres -d postgres < database/scripts/validar_cuotas_descuentos_pago_adelantado.sql
```

Resultado esperado:

```txt
tabla_config                OK
config_pago_adelantado      OK
pago_subtotal               OK
pago_descuento_porcentaje   OK
pago_descuento_monto        OK
```

## Notas técnicas

- `pago.total` sigue siendo columna generada en remoto, por lo que no se actualiza directamente.
- `pago.monto_pagado` representa el total final efectivamente cobrado.
- `pago.subtotal` representa el importe antes de descuento.
- Los descuentos se guardan como snapshot para preservar trazabilidad si la parametrización cambia en el futuro.
