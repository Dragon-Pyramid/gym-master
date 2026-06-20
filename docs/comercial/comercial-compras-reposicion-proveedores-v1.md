# Gym Master - Comercial / Compras, reposición y proveedores v1

## Rama

`feature/comercial-compras-reposicion-proveedores-v1`

## Objetivo

Completar la base comercial posterior a Stock Ledger, POS/Kiosco y Caja/Cashup con un flujo operativo para proveedores, órdenes de compra, recepción de mercadería y reposición sugerida.

## Alcance funcional

- Nueva pantalla: `Comercial y Stock > Compras / Reposición`.
- Ruta: `/dashboard/comercial/compras-reposicion`.
- Endpoint: `GET/POST /api/comercial/compras-reposicion`.
- Asociación producto-proveedor con costo de compra, compra mínima, lead time y proveedor principal.
- Vista de reposición sugerida desde stock actual, mínimo y objetivo.
- Creación de órdenes de compra comerciales.
- Recepción total o parcial de mercadería.
- Integración con `comercial_stock_movimiento` mediante movimientos tipo `compra`.
- Actualización de stock por ubicación y stock total legacy.
- Actualización de costo vigente del producto e historial de costo.

## Base de datos privada

Migración privada sugerida:

`202606200930_comercial_compras_reposicion_proveedores_v1.sql`

Nuevas entidades:

- `comercial_proveedor_producto`
- `comercial_orden_compra`
- `comercial_orden_compra_detalle`
- `vw_comercial_reposicion_sugerida`

## Validación

Validación privada sugerida:

`validar_comercial_compras_reposicion_proveedores_v1.sql`

Debe validar:

- Existencia de tablas nuevas.
- Existencia de vista de reposición sugerida.
- Policies service_role.
- Consulta básica sobre la vista.

## Consideraciones

La recepción de mercadería no actualiza stock manualmente de forma aislada: usa el Stock Ledger para preservar trazabilidad. Esto permite que POS, caja, compras y reportes compartan la misma fuente de verdad.

## Próximos pasos

- Servicios, packs y promociones.
- Scanner celular hacia PC.
- BI comercial e IA para sugerencias de reposición y promociones.
