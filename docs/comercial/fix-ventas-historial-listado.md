# Fix — Ventas: historial/listado y relación con stock

## Rama

`fix/ventas-historial-listado`

## Problema detectado

En el recorrido manual de producción se detectó que el módulo **Ventas** permitía registrar una venta, pero el historial/listado quedaba vacío y mostraba un error genérico tipo `Bad Request`.

Al revisar el repositorio y el dump se confirmó que el dump contiene un historial grande de ventas y detalles:

- `venta`: más de 1.300 registros.
- `venta_detalle`: más de 1.600 registros.
- `producto_stock_movimiento`: historial de movimientos asociado a ventas, ajustes, devoluciones y reversiones.

El listado recuperaba todas las ventas y luego intentaba traer todos los detalles con un único filtro `.in('venta_id', ventaIds)`. En historiales grandes, PostgREST arma ese filtro en la URL; con cientos o miles de UUID puede producir un `400 Bad Request` por longitud/tamaño de consulta.

## Solución aplicada

Se ajustó `src/services/ventaService.ts` para que el detalle del historial de ventas se recupere por tandas.

Cambios principales:

- Se agregó `VENTA_DETALLE_BATCH_SIZE`.
- Se agregó helper `chunkArray`.
- `getDetallesByVentaIds` ahora consulta `venta_detalle` en grupos de UUIDs y luego agrupa el resultado en memoria por `venta_id`.
- Se mejoró el mensaje técnico de error del listado de ventas.
- Al crear una venta se guarda `registrado_por` con el usuario autenticado cuando está disponible.

## Revisión de lógica de negocio

La lógica central de ventas y stock se mantiene.

### Alta de venta

- Crea cabecera de venta.
- Crea detalle de productos/servicios.
- Si el ítem es producto, valida stock disponible.
- Descuenta stock del producto.
- Registra movimiento `producto_stock_movimiento` con tipo `venta`.
- Actualiza total de la venta.

### Error durante el alta

Si falla alguna parte del alta:

- Revierte stock de productos ya afectados.
- Borra detalles creados.
- Borra la cabecera de venta.

### Anulación de venta

- No elimina físicamente la venta.
- Marca la venta como `estado = anulada` y `activo = false`.
- Devuelve el stock de productos vendidos.
- Registra movimiento `producto_stock_movimiento` con tipo `reversion_venta`.
- Evita revertir dos veces la misma venta si el usuario reintenta la anulación.

## Observación de negocio

No se cambió la lógica de stock porque el circuito actual es correcto para:

- venta de producto,
- venta de servicio,
- descuento de stock,
- anulación,
- reposición de stock,
- trazabilidad de movimientos.

Sí queda recomendado para una feature futura crear un flujo formal de **devoluciones/cambios parciales**, porque editar ítems de una venta ya registrada no debe hacerse como una simple edición de detalle: debe generar movimientos de stock auditables.

## Validación sugerida

1. Entrar a `/dashboard/ventas`.
2. Confirmar que el historial carga ventas existentes.
3. Verificar métricas superiores:
   - Ventas activas.
   - Total vendido.
   - Ítems vendidos.
   - Anuladas.
4. Abrir una venta con `Ver` y confirmar que muestra detalles.
5. Registrar una nueva venta de producto y confirmar que descuenta stock.
6. Anular una venta de producto y confirmar que devuelve stock.
7. Validar exportación Excel.
8. Ejecutar:

```bash
npm run build
npm run test:e2e
```

## Base de datos

No requiere migración nueva.
