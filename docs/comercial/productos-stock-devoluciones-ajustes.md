# Productos / Stock — Devoluciones, mermas y ajustes

## Rama

`feature/productos-stock-devoluciones-ajustes`

## Objetivo

Agregar una base operativa para registrar movimientos manuales y comerciales de stock con trazabilidad, sin depender únicamente de la venta/anulación automática.

## Alcance implementado

- Nuevo endpoint `GET /api/productos/stock-movimientos` para consultar movimientos.
- Nuevo endpoint `POST /api/productos/stock-movimientos` para registrar movimientos.
- Nuevo modal de movimiento de stock desde el listado de productos.
- Nuevo formulario `ProductoStockMovimientoForm`.
- Vista previa de stock anterior, delta y stock nuevo antes de confirmar.
- Historial reciente de movimientos dentro del detalle del producto.
- Acciones soportadas:
  - Ajuste de entrada.
  - Ajuste de salida.
  - Recuento físico.
  - Devolución vendible.
  - Merma / producto no apto.
  - Compra / reposición.
- Validación para evitar stock negativo.
- Registro en `producto_stock_movimiento` usando los tipos ya disponibles en la base.
- Actualización de Swagger/OpenAPI.

## Modelo usado

Se reutiliza la tabla existente `public.producto_stock_movimiento`, creada en el bloque de ventas/kiosco. La tabla ya contempla:

- `producto_id`
- `venta_id`
- `venta_detalle_id`
- `tipo`
- `cantidad`
- `stock_anterior`
- `stock_nuevo`
- `motivo`
- `creado_por`
- `creado_en`

Por eso esta feature no requiere migración nueva.

## Reglas funcionales

- Las entradas, devoluciones vendibles y compras suman stock.
- Las salidas manuales y mermas descuentan stock.
- El recuento físico ajusta al stock real contado.
- No se permite una operación que deje stock negativo.
- Toda operación requiere motivo.
- Toda operación queda trazada en movimientos de stock.

## Validación recomendada

1. Crear ajuste de entrada y verificar que el stock sube.
2. Crear ajuste de salida y verificar que el stock baja.
3. Crear recuento físico y verificar que el stock queda igual al contado.
4. Crear devolución vendible y verificar que suma stock.
5. Crear merma y verificar que resta stock.
6. Abrir detalle de producto y revisar historial de movimientos.
7. Confirmar que el build pasa.
