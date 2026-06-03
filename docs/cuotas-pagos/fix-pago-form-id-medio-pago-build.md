# Fix build PagoForm id_medio_pago

Se corrige el tipo de `id_medio_pago` en el estado del formulario de pagos manuales.

## Problema

`handleMedioPagoChange` estaba guardando `null` en `form.id_medio_pago`, pero el estado del formulario tipa ese campo como `string`. Esto hacía fallar `npm run build` con TypeScript.

## Corrección

- En el estado del formulario se conserva el ID seleccionado como `string`, incluyendo valores fallback como `fallback-efectivo`.
- En el submit se mantiene la normalización hacia payload: valores fallback se transforman a `null` antes de enviar al backend.
- El backend ya protege también contra IDs no UUID.
