# Gym Master — Comercial POS mobile final polish v1

## Rama

`feature/comercial-pos-mobile-final-polish-v1`

## Objetivo

Pulir la experiencia mobile final del POS/Kiosco comercial, preservando el flujo de venta existente y mejorando el uso en celular/tablet para ventas rápidas, scanner móvil, carrito, ticket y operación de stock por ubicación.

## Alcance aplicado

- Se ajustó `/dashboard/comercial/kiosco` con shell vertical controlado para evitar espacio blanco posterior al footer.
- Se reforzó el layout responsive del POS con `Header / Contenido / Footer` y scroll interno.
- Se agregó un header operativo mobile-first con resumen de carrito, total actual, método de pago y estado del POS.
- Se agregó resumen compacto mobile de catálogo visible y estado del scanner.
- Se mejoró la presentación del scanner móvil y la URL de conexión para evitar overflow horizontal.
- Se refinó el grid de métricas para mobile/tablet/desktop.
- Se mejoró la zona de búsqueda, código/SKU/barcode y ubicación de venta.
- Se reforzó el layout del carrito con contador de ítems, card sticky en desktop amplio y resumen sticky inferior en mobile/tablet.
- Se mejoró contraste claro/oscuro en cards clave.

## Reglas preservadas

- No se modifican endpoints.
- No se modifica base de datos.
- No se modifica Swagger.
- No se cambia la lógica de stock ledger ni confirmación de venta.
- No se cambia el flujo de scanner móvil ya validado.
- No se suben SQL, dumps ni configuración sensible.

## Validación sugerida

1. Entrar como admin a `/dashboard/comercial/kiosco`.
2. Buscar producto por nombre/SKU/barcode.
3. Agregar producto al carrito.
4. Agregar servicio y pack si están disponibles.
5. Cambiar cantidad, precio y descuento.
6. Confirmar venta.
7. Imprimir último ticket.
8. Probar scanner móvil con QR.
9. Probar F12 mobile y desktop.
10. Confirmar que no hay scroll horizontal ni espacio blanco después del footer.
