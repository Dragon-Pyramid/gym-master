# Gym Master — Comercial POS final QA polish v1

## Rama

`feature/comercial-pos-final-qa-polish-v1`

## Objetivo

Realizar una pasada final de calidad funcional sobre el módulo POS/Kiosco después del cierre de códigos comerciales, scanner móvil, packs/promociones y analítica de packs.

La feature busca dejar el flujo comercial más consistente para uso productivo: venta manual de productos, servicios y packs; venta por códigos; scanner móvil; stock por ubicación; cupones; ticket imprimible; y trazabilidad BI.

## Alcance

- POS/Kiosco ahora carga servicios activos dentro del dashboard.
- Nueva tarjeta de métrica para servicios disponibles.
- Búsqueda unificada por producto, SKU, código de barras, servicio, código de servicio, pack o descripción.
- Alta manual de servicios al carrito desde la pantalla POS.
- Alta manual de servicios por código comercial en el campo de scanner/barcode.
- Conservación del alta de servicios por scanner móvil y QR interno.
- Mejora de mensajes de error para carrito vacío.
- Texto operativo actualizado para reflejar productos, servicios, packs, cupones y BI.
- Ticket imprimible con escape básico de HTML para datos dinámicos.
- Swagger actualizado para describir el flujo POS completo.
- Sin migración de base de datos.

## Decisiones técnicas

### Servicios como ítems vendibles de POS

La pantalla POS ya soportaba servicios en backend y `venta_detalle`, pero la carga manual quedaba limitada a productos y packs. En esta versión se expone `servicio` como entidad vendible en el dashboard POS, usando la tabla `servicio` y su campo `codigo`.

### Compatibilidad con el modelo existente

No se modifica `venta_detalle`. Los productos siguen descontando stock y generando movimientos. Los servicios se registran como líneas `item_tipo = servicio`, sin impacto de stock. Los packs mantienen el comportamiento de expansión interna a productos/servicios y el registro analítico en `comercial_pack_venta`.

### Sin migración DB

No se agrega migración porque los campos requeridos ya existen:

- `servicio.codigo`
- `venta_detalle.item_tipo = producto | servicio`
- `comercial_pack_venta`
- `vw_comercial_pack_analytics`

## Archivos modificados

- `src/app/dashboard/comercial/kiosco/page.tsx`
- `src/interfaces/comercialPos.interface.ts`
- `src/services/server/comercialKioscoPosServerService.ts`
- `src/lib/swagger/openApiSpec.ts`
- `docs/comercial/comercial-pos-final-qa-polish-v1.md`

## Checklist de validación funcional

1. Entrar a `/dashboard/comercial/kiosco`.
2. Verificar métricas: ventas hoy, total, ítems, productos, servicios, packs, promociones y críticos.
3. Buscar un producto por nombre/SKU/barcode y agregarlo al carrito.
4. Buscar un servicio por nombre/código y agregarlo al carrito.
5. Buscar un pack por nombre/código y agregarlo al carrito.
6. Pegar o escanear manualmente un código de producto.
7. Pegar o escanear manualmente un código de servicio.
8. Pegar o escanear manualmente un código de pack.
9. Conectar scanner móvil y escanear producto/servicio/pack.
10. Confirmar venta con producto y verificar stock ledger.
11. Confirmar venta con servicio y verificar `venta_detalle`.
12. Confirmar venta con pack y verificar expansión + `comercial_pack_venta`.
13. Confirmar venta con cupón vigente.
14. Imprimir ticket de venta reciente.
15. Revisar `/dashboard/comercial/pack-analytics`.

## Resultado esperado

El POS/Kiosco queda más cerrado para producción: no solo vende productos y packs, sino también servicios manualmente y por código, manteniendo compatibilidad con stock, caja, ticket y BI.
