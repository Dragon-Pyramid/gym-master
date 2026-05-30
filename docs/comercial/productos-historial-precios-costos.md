# Productos — historial de precios y costos

**Feature:** `feature/productos-historial-precios-costos`  
**Fecha:** 2026-05-30

## Objetivo

Agregar trazabilidad comercial sobre cambios de precio de venta y costo de compra de productos.

## Alcance

- Nueva tabla `producto_precio_costo_historial`.
- Registro inicial automático para productos existentes durante la migración.
- Registro automático cuando cambia precio o costo desde `ProductoForm`.
- Nuevos campos operativos en formulario de producto: costo, stock mínimo, motivo, moneda, cotización y fecha de vigencia.
- Historial visible desde el detalle del producto.
- Tabla, Excel y PDF de productos con costo y margen estimado.
- Endpoint `GET /api/productos/historial-precios-costos?producto_id=...`.

## Flujo esperado

1. El administrador crea o edita un producto.
2. Si cambia el precio o el costo, el sistema registra un snapshot histórico.
3. El detalle del producto muestra los cambios con precio anterior/nuevo, costo anterior/nuevo, margen y motivo.

## Validación DB

El script `database/scripts/validar_productos_historial_precios_costos.sql` valida tabla, columnas, inserción y valores esperados usando `ROLLBACK`.
