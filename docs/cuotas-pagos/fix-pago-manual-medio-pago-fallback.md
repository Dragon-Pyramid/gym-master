# Fix — Pago manual con medio de pago fallback

## Contexto

Al registrar un pago manual usando el medio de pago fallback del formulario, el frontend podía enviar valores como `fallback-efectivo` en `id_medio_pago`.

La columna `pago.id_medio_pago` es UUID/null, por lo que PostgreSQL rechazaba el insert con:

```txt
invalid input syntax for type uuid: "fallback-efectivo"
```

## Corrección

- El formulario mantiene el fallback visual para mostrar opciones si el catálogo no carga.
- Antes de enviar el payload, si `id_medio_pago` empieza con `fallback-`, se envía `null`.
- El backend también valida `id_medio_pago` como UUID y descarta valores no UUID.
- Se conserva `metodo_pago = efectivo | transferencia | otro`, por lo que el pago queda clasificado aunque no exista FK de catálogo.

## Archivos

- `src/components/forms/PagoForm.tsx`
- `src/services/server/pagoServerService.ts`

## Prueba recomendada

1. Registrar pago manual con método Efectivo.
2. Registrar 2 o más meses cubiertos.
3. Confirmar que calcula subtotal/descuento/total.
4. Confirmar que no aparece error UUID fallback.
5. Confirmar que el socio queda reactivado si estaba inactivo.
