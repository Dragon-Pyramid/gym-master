# Gym Master - Comercial Stock Ledger Foundation v1

## Rama

`feature/comercial-stock-ledger-foundation-v1`

## Objetivo

Crear la fundación comercial de stock ledger para que Productos, Kiosco, Compras, Reposición, Scanner y BI trabajen sobre movimientos auditables y stock por ubicación, no solamente sobre el campo legacy `producto.stock`.

La feature mantiene compatibilidad con el módulo actual de productos sincronizando el total calculado del ledger contra `producto.stock`.

## Alcance funcional

- Nueva pantalla `Comercial y Stock -> Stock Ledger`.
- Nuevas ubicaciones físicas de stock: Depósito, Kiosco, Recepción, Heladera, Vitrina y Sala profesores.
- Stock actual por producto y ubicación.
- Movimientos auditables de stock:
  - compra
  - venta
  - ajuste entrada
  - ajuste salida
  - transferencia
  - devolución
  - merma
  - vencimiento
  - conteo físico
  - uso interno
- Métricas comerciales:
  - productos activos
  - productos sin stock
  - productos críticos / bajo mínimo
  - unidades totales
  - valor estimado de inventario
  - movimientos recientes
  - ubicaciones activas
- Tabla resumen con costo, precio, margen, stock total, estado y ubicaciones.
- Historial de movimientos recientes.
- Panel de stock por ubicación.

## Cambios de base de datos

La migración privada `202606190630_comercial_stock_ledger_foundation_v1.sql` agrega:

- `comercial_ubicacion_stock`
- `comercial_producto_stock_ubicacion`
- `comercial_stock_movimiento`
- `vw_comercial_stock_resumen`

También migra el stock existente de `producto.stock` a la ubicación inicial `kiosco`, evitando pérdida de datos y manteniendo la compatibilidad con pantallas previas.

## Seguridad

Las nuevas tablas tienen RLS habilitado y forzado. El acceso se realiza desde API server usando `SUPABASE_SERVICE_ROLE_KEY`, igual que otros módulos internos que centralizan reglas de negocio en backend.

## API

Nuevo endpoint:

- `GET /api/comercial/stock-ledger`
- `POST /api/comercial/stock-ledger`

El endpoint requiere autenticación y valida reglas de negocio del lado servidor:

- producto obligatorio
- tipo de movimiento obligatorio
- motivo mínimo
- ubicación origen/destino según tipo
- stock suficiente para salidas y transferencias
- conteo físico no negativo

## UI

Nueva pantalla:

`/dashboard/comercial/stock-ledger`

Desde la pantalla se puede:

- ver métricas generales de stock
- buscar productos
- registrar movimientos
- transferir entre ubicaciones
- registrar conteo físico
- ver resumen por producto
- ver movimientos recientes
- ver stock por ubicación

## Swagger

Se documentó el endpoint `/api/comercial/stock-ledger` en `src/lib/swagger/openApiSpec.ts` bajo el tag `Comercial / Stock`.

## Relación con benchmark

Esta base toma buenas prácticas observadas en InvenTree, OpenBoxes, Part-DB y Grocy:

- stock por ubicación
- ledger de movimientos
- conteo físico
- reposición futura
- compatibilidad con barcode/QR
- trazabilidad de inventario

## Próximas fases

Esta feature prepara las siguientes etapas:

1. `feature/comercial-kiosco-pos-foundation-v1`
2. `feature/comercial-compras-reposicion-proveedores-v1`
3. `feature/comercial-caja-cashup-reportes-v1`
4. `feature/comercial-servicios-packs-promociones-v1`
5. `feature/comercial-mobile-barcode-scanner-realtime-v1`
6. `feature/comercial-bi-ia-recomendaciones-v1`

## Validación esperada

- Migración privada aplicada en QA local.
- Validación SQL con mensaje `Validación OK Comercial Stock Ledger`.
- Build Next.js exitoso.
- Sin versionar SQL privado ni scripts de base de datos.
