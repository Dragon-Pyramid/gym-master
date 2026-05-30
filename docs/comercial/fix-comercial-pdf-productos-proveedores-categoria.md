# Fix comercial: PDF profesional y categoría legible en productos

## Rama

`feature/proveedores-comercial-profile`

## Objetivo

Resolver ajustes detectados durante QA de la feature de proveedores:

- Reemplazar el flujo de impresión del navegador por descarga PDF profesional.
- Unificar criterio de nomenclatura visual: `Descargar PDF` en lugar de `Imprimir`.
- Aplicar el criterio a proveedores y productos.
- Corregir la visualización de categoría en el detalle de producto para mostrar la descripción/nombre del catálogo en lugar del UUID.

## Alcance

### Proveedores

- Se reemplaza el botón `Imprimir` por `Descargar PDF`.
- Se genera PDF profesional con membrete Gym Master, título del reporte, métricas, filtro aplicado y tabla de proveedores.
- Se conserva exportación Excel como descarga de datos.

### Productos

- Se agrega botón `Descargar PDF` junto a exportación Excel.
- Se genera PDF profesional con membrete Gym Master, métricas de inventario, filtro aplicado y tabla de productos.
- El detalle de producto ahora muestra la categoría legible tomada desde el catálogo parametrizable.

## Criterio definido

Para módulos comerciales/administrativos, el botón `Imprimir` debe migrarse progresivamente a `Descargar PDF`, con PDF profesional y membretado. Excel queda reservado para exportación de datos.

## Sin cambios de base de datos

Este fix no agrega migraciones ni modifica estructura de base de datos.
