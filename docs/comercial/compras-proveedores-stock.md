# Compras, proveedores y reposición de stock

## Rama

`feature/compras-proveedores-stock`

## Objetivo

Incorporar el flujo base de compras a proveedores para registrar reposiciones de stock, mantener trazabilidad por proveedor y alimentar futuros reportes financieros/BI.

## Alcance

- Nueva pantalla `/dashboard/compras`.
- Nueva API `/api/compras` y `/api/compras/[id]`.
- Alta de compras con proveedor, fecha, estado, medio de pago, comprobante y observaciones.
- Detalle de productos comprados con cantidad y costo unitario.
- Actualización automática de stock por compra.
- Registro de movimiento de stock tipo `compra`.
- Actualización del costo vigente del producto con el costo de compra.
- Registro de historial de costo cuando el costo cambia.
- Anulación de compra con reversión de stock cuando es posible.
- Exportación Excel y descarga PDF del listado de compras.
- Integración con menú lateral y dashboard Comercial / Kiosco.

## Base de datos

Migración privada/local no versionable en repo público:

`supabase/migrations/202605302100_compras_proveedores_stock.sql`

Script de validación:

`database/scripts/validar_compras_proveedores_stock.sql`

## Validación requerida

1. Restaurar dump remoto en Supabase local QA.
2. Aplicar migración local.
3. Ejecutar validación local.
4. Realizar backup remoto previo.
5. Aplicar `npx supabase db push`.
6. Refrescar schema cache remoto.
7. Ejecutar validación remota.
8. Probar app contra remoto.
