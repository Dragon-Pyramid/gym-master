# Corrección — Anulación de ventas y reposición de stock

## Rama

`feature/ventas-kiosco-detalle-consumidor-final`

## Problema detectado

Al anular una venta con productos, la venta pasaba a estado `anulada`, pero el stock descontado durante la venta no volvía al producto.

Ejemplo real:

- Stock inicial: 25
- Venta: 2 unidades
- Stock posterior a venta: 23
- Anulación: el stock seguía en 23

## Corrección aplicada

La anulación de venta ahora:

1. Obtiene los detalles de la venta.
2. Filtra solo ítems de tipo `producto`.
3. Devuelve al stock la cantidad vendida.
4. Registra movimiento en `producto_stock_movimiento` con `tipo = 'reversion_venta'`.
5. Marca la venta como `estado = 'anulada'` y `activo = false`.
6. Evita devolver stock dos veces si la anulación se reintenta.

## Nota operativa

Si una venta fue anulada antes de esta corrección y el stock ya quedó mal, esa venta no se repara automáticamente porque ya figura como anulada. Ese caso puntual debe corregirse con una revisión manual del producto/movimiento o con un script controlado de reparación.
