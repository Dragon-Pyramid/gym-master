# Fix — Pagos manuales: autocalculo de monto y descuento

## Contexto

En el formulario de pagos manuales, el panel de descuento por pago adelantado podía mostrar subtotal, descuento y total en `$0` cuando el selector quedaba en la opción `Cuota vigente / última activa`.

La causa era que el frontend dependía estrictamente de `form.cuota_id`. Si el formulario era reinicializado por la carga de medios de pago o si el usuario dejaba la cuota por defecto, `selectedCuota` quedaba vacío y el cálculo no tenía monto base.

## Cambio aplicado

- El formulario usa como cuota efectiva la cuota seleccionada o, si no hay selección explícita, la primera cuota activa disponible.
- La carga de medios de pago ya no resetea el formulario completo ni borra `cuota_id`.
- Al cambiar meses cubiertos, el subtotal, descuento y monto sugerido se recalculan automáticamente.
- El período `cubre hasta` sigue actualizándose según `periodo_desde` + `meses_cubiertos`.

## Resultado esperado

Al registrar un pago manual:

- `meses_cubiertos = 1` calcula `monto_pagado = cuota vigente`.
- `meses_cubiertos >= cuotas_minimas` aplica el descuento configurado.
- El panel muestra subtotal, descuento y total sugerido reales.
- El pago mantiene coherencia con recibos, historial y BI.
