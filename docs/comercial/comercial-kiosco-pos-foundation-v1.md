# Gym Master - Comercial Kiosco POS Foundation v1

## Rama

`feature/comercial-kiosco-pos-foundation-v1`

## Objetivo

Crear la primera pantalla operativa de Punto de Venta / Kiosco sobre la base de Stock Ledger Comercial ya incorporada.

La feature permite registrar ventas rápidas de productos, validar stock por ubicación, descontar stock mediante el ledger comercial y emitir un ticket imprimible básico.

## Alcance funcional

- Nueva pantalla `Comercial y Stock -> POS / Kiosco`.
- Ruta `/dashboard/comercial/kiosco`.
- Buscador por nombre, SKU o código de barras.
- Entrada manual de código/SKU para uso con lector o pegado rápido.
- Selección de ubicación de venta: Kiosco, Depósito, Recepción, Heladera, Vitrina u otra ubicación activa.
- Carrito de productos con cantidad, precio unitario y descuento por línea.
- Validación de stock disponible en la ubicación seleccionada.
- Confirmación de venta con método de pago.
- Registro de cabecera en `venta`.
- Registro de detalles en `venta_detalle`.
- Descuento de stock en `comercial_producto_stock_ubicacion`.
- Registro en `comercial_stock_movimiento` con referencia a la venta.
- Sincronización de `producto.stock` para mantener compatibilidad con pantallas existentes.
- Registro legacy en `producto_stock_movimiento` para trazabilidad histórica.
- Ticket imprimible básico desde el navegador.
- Métricas de ventas del día e historial reciente.

## API

Nuevo endpoint:

- `GET /api/comercial/kiosco-pos`
- `POST /api/comercial/kiosco-pos`

## Base de datos

No requiere migración nueva. La feature reutiliza:

- `venta`
- `venta_detalle`
- `producto`
- `comercial_ubicacion_stock`
- `comercial_producto_stock_ubicacion`
- `comercial_stock_movimiento`
- `producto_stock_movimiento`
- `vw_comercial_stock_resumen`

## Seguridad

El endpoint requiere autenticación. Las operaciones server-side usan `SUPABASE_SERVICE_ROLE_KEY` para respetar RLS y centralizar las reglas de negocio en backend.

## Limitaciones v1

- La venta a socio queda para una etapa posterior de POS avanzado.
- No incluye cierre de caja.
- No incluye promociones, cupones ni combos.
- No incluye scanner celular -> PC en tiempo real.
- No incluye facturación fiscal.

## Próximas fases

- `feature/comercial-caja-cashup-reportes-v1`
- `feature/comercial-compras-reposicion-proveedores-v1`
- `feature/comercial-servicios-packs-promociones-v1`
- `feature/comercial-mobile-barcode-scanner-realtime-v1`
- `feature/comercial-bi-ia-recomendaciones-v1`
