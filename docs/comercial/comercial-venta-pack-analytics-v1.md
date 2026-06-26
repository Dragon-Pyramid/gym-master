# Gym Master — Comercial venta pack analytics v1

## Rama

`feature/comercial-venta-pack-analytics-v1`

## Objetivo

Agregar trazabilidad y BI específico para packs/promociones vendidos desde POS/Kiosco.

La feature anterior permitió vender packs directamente desde el POS expandiéndolos a productos/servicios para mantener compatibilidad con `venta_detalle`, stock ledger y reportes existentes. Esta feature agrega una capa analítica para saber qué pack fue vendido, cuántas veces, cuánto ingreso generó, qué cupón/promoción se aplicó y qué componentes tenía al momento de la venta.

## Alcance

- Nueva tabla privada `comercial_pack_venta`.
- Nueva vista agregada `vw_comercial_pack_analytics`.
- Registro automático de packs vendidos desde `createComercialKioscoPosVenta`.
- Snapshot JSON de componentes del pack al momento de la venta.
- Asociación opcional de cupón/promoción aplicada.
- Descuento de cupón estimado por pack.
- Nuevo endpoint `GET /api/comercial/pack-analytics`.
- Nueva pantalla `/dashboard/comercial/pack-analytics`.
- Métricas: ventas con pack, unidades vendidas, ingresos, ticket promedio, cupones usados y descuento estimado.
- Ranking de packs.
- Ranking de cupones/promociones.
- Evolución mensual.
- Últimas ventas con packs.
- Menú y permisos en Comercial y Stock.
- Swagger/OpenAPI actualizado.

## Decisión técnica

No se modifica `venta_detalle` para aceptar `item_tipo = pack`. El POS mantiene el diseño actual: el pack se captura como ítem comercial, pero al guardar la venta se expande a productos/servicios reales.

Para BI se agrega `comercial_pack_venta`, que registra el pack vendido como entidad comercial analítica sin romper:

- stock ledger,
- tickets,
- ventas existentes,
- reportes actuales,
- constraints de `venta_detalle`.

## Validación

1. Ejecutar migración privada.
2. Ejecutar `database/scripts/validar_comercial_venta_pack_analytics_v1.sql`.
3. Crear venta POS con pack.
4. Verificar registro en `comercial_pack_venta`.
5. Abrir `/dashboard/comercial/pack-analytics`.
6. Confirmar métricas y tablas.
7. Probar filtro de fechas.
8. Confirmar que venta anulada no impacte como activa en la vista agregada.

## Pendientes derivados

- Exportar PDF/Excel específico de BI Packs si se requiere.
- Integrar estos indicadores al dashboard comercial principal de forma más avanzada.
- Analítica de rentabilidad real por pack comparando precio de venta vs costo de productos incluidos.
