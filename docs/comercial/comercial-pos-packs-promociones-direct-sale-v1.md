# Comercial POS packs promociones direct sale v1

## Objetivo

Cerrar el ciclo del POS/Kiosco permitiendo vender packs comerciales, promociones y cupones desde la misma pantalla rápida de venta y desde el scanner móvil.

## Alcance

- El POS carga packs disponibles para venta (`comercial_pack.disponible_pos = true`).
- El buscador permite encontrar productos y packs.
- El ingreso manual por código/SKU también acepta el código comercial del pack.
- El scanner móvil agrega packs al carrito cuando recibe un evento `item_tipo = pack`.
- El carrito acepta líneas de tipo `pack` además de producto y servicio.
- Al confirmar la venta, el backend expande cada pack a sus productos/servicios internos.
- Los productos incluidos en packs descuentan stock y registran movimientos de stock como una venta normal.
- Los servicios incluidos en packs quedan registrados como líneas de servicio.
- El precio final del pack se distribuye proporcionalmente entre sus ítems internos para mantener compatibilidad con `venta_detalle` actual.
- El POS acepta cupón/promoción opcional y aplica descuentos automáticos para promociones de tipo `descuento_porcentaje` o `descuento_fijo`.
- El uso del cupón incrementa `comercial_cupon.usos_actuales`.
- La venta mantiene trazabilidad en `venta.observaciones` indicando packs y cupón aplicado.

## Decisión técnica

No se agrega migración DB en esta versión porque el modelo actual de `venta_detalle` ya soporta productos y servicios, pero no packs como línea directa. Para evitar romper restricciones y reportes existentes, el pack se trata como una entidad comercial de captura en POS, pero se persiste expandido en los ítems vendibles reales.

Esto permite:

- mantener compatibilidad con reportes y stock ledger;
- evitar cambios destructivos sobre `venta_detalle`;
- descontar stock correctamente;
- dejar trazabilidad mediante observaciones y movimientos de stock.

## Validación funcional

1. Abrir `/dashboard/comercial/kiosco`.
2. Ver métricas de packs POS y promociones.
3. Buscar un pack por nombre o código.
4. Agregar pack al carrito manualmente.
5. Conectar scanner móvil.
6. Escanear QR/código de pack.
7. Confirmar que se agrega al carrito como Pack comercial.
8. Ingresar cupón vigente si corresponde.
9. Confirmar venta.
10. Verificar que los productos del pack descuentan stock.
11. Verificar movimientos en stock ledger.
12. Imprimir ticket.
13. Confirmar que la venta queda registrada con observaciones de pack/cupón.

## Pendientes futuros

- Modelo analítico específico `venta_pack` si se requiere reportar packs vendidos como entidad independiente.
- Anulación inteligente con trazabilidad explícita de pack.
- Reportes de rentabilidad por pack.
- Promociones combinables/acumulables más avanzadas.
- Venta a socio desde POS avanzado.
