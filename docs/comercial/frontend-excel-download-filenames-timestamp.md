# Fix frontend - nombres de descarga Excel con timestamp

## Objetivo

Estandarizar los nombres de archivos Excel descargados desde el frontend para que sigan el mismo criterio aplicado a PDFs.

## Formato aplicado

```txt
YYYYMMDD-HHMM-tipo-de-listado.xlsx
```

Ejemplos:

```txt
20260531-0845-listado-gastos-egresos.xlsx
20260531-0845-listado-compras-proveedores.xlsx
20260531-0845-listado-productos.xlsx
```

## Alcance

Se actualizan las exportaciones Excel de los principales listados administrativos y comerciales:

- Actividades
- Asistencias
- Compras
- Cuotas
- Entrenadores
- Equipamientos
- Evolución Física
- Gastos / Egresos
- Pagos
- Productos
- Proveedores
- Servicios
- Socios
- Usuarios
- Ventas
- Detalles de venta

## Notas técnicas

- No modifica base de datos.
- No requiere migración.
- Reutiliza `buildTimestampedDownloadFileName` desde `src/utils/downloadFileName.ts`.
