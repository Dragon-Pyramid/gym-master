# Comercial — Productos códigos barcode QR v1

## Objetivo

Cerrar el ciclo del scanner móvil/POS permitiendo que productos, servicios y packs tengan códigos operativos escaneables.

## Alcance

- Productos: exposición de `sku` y `codigo_barras` en alta/edición/listado/detalle.
- Servicios: nuevo campo `codigo` para resolución desde POS/scanner.
- Packs: uso del código comercial existente como QR/código escaneable.
- Scanner móvil: resolución directa de servicios por `servicio.codigo`.
- Comercial: nueva pantalla `/dashboard/comercial/codigos-etiquetas` para consultar cobertura de códigos, generar QR internos para productos/servicios e imprimir etiquetas A4.
- Swagger: endpoints de etiquetas y generación de QR comercial.

## DB

Migración privada:

```txt
supabase/migrations/202606222245_comercial_productos_codigos_barcode_qr_v1.sql
```

Validación privada:

```txt
database/scripts/validar_comercial_productos_codigos_barcode_qr_v1.sql
```

No commitear SQL al repo público.

## Validación funcional

1. Crear/editar producto con SKU y código de barras.
2. Crear/editar servicio con código comercial.
3. Abrir Comercial y Stock → Códigos / Etiquetas.
4. Generar QR para producto y servicio.
5. Imprimir etiqueta individual y múltiple A4.
6. Abrir POS / Kiosco.
7. Conectar scanner móvil.
8. Escanear SKU/código de barras/QR de producto.
9. Escanear código/QR de servicio.
10. Confirmar que el POS agrega el ítem correcto al carrito.

## Pendiente derivado

La venta directa de packs como línea única en `venta_detalle` queda para una futura integración POS avanzada, porque la estructura actual del detalle de venta soporta producto/servicio.
