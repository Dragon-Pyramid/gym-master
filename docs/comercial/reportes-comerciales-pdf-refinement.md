# Reportes comerciales PDF - refinamiento visual

## Rama

`feature/reportes-comerciales-pdf-refinement`

## Objetivo

Refinar la presentación de los reportes PDF comerciales y operativos de Gym Master para que tengan una salida más profesional, consistente y legible durante demos, auditorías internas y entrega al cliente.

## Alcance

La mejora se concentra en el generador compartido `src/utils/commercialReportPdf.ts`, utilizado por reportes de pagos, ventas, compras, productos/stock, socios, cuotas, finanzas, actividades, ranking/bonificación, empleados, proveedores, servicios y otros listados comerciales.

También se ajusta el PDF específico de equipamiento/mantenimiento, que usa un render propio por su estructura ejecutiva con métricas, gráficos, historial y recomendaciones.

## Cambios principales

- Pie de página unificado con numeración real `Página X de Y`.
- Línea separadora de pie para mejorar lectura y presentación.
- Corrección de ejes de gráficos: los reportes no monetarios ya no muestran valores con `$`.
- Etiquetas de gráficos compactadas para reducir solapamientos en reportes con muchos datos.
- Filtros aplicados en PDF con ajuste de líneas para evitar desbordes laterales.
- Gráficos impares o únicos usando ancho completo del reporte.
- Tablas con encabezado oscuro y texto blanco para contraste profesional.
- PDF de equipamiento con pie de página y numeración total de páginas.

## Reportes impactados por el generador compartido

- Pagos
- Ventas
- Compras
- Productos / stock
- Socios
- Cuotas
- Finanzas / BI
- Actividades / turnos / cupos
- Ranking / bonificación mensual
- Asistencias
- Empleados
- Sueldos
- Proveedores
- Servicios
- Notificaciones
- Otros gastos

## Recorrido manual sugerido

1. `/dashboard/pagos` → Descargar PDF.
2. `/dashboard/ventas` → Exportar PDF si hay historial cargado.
3. `/dashboard/compras` → Descargar PDF.
4. `/dashboard/productos` → Descargar PDF.
5. `/dashboard/finanzas` → Descargar PDF/BI.
6. `/dashboard/actividades` → Descargar PDF.
7. `/dashboard/socios-ranking-bonificacion` → Descargar PDF.
8. `/dashboard/bi/socios-demografia` → Descargar PDF.
9. `/dashboard/equipamientos` → Descargar PDF.

## Validaciones esperadas

- El PDF abre correctamente.
- El encabezado muestra marca/gimnasio y título del reporte.
- Los filtros no se salen del margen.
- Los KPIs se ven claros.
- Los gráficos no superponen etiquetas de forma crítica.
- Los ejes no monetarios no muestran símbolo `$`.
- Las tablas tienen encabezados legibles.
- La numeración muestra `Página X de Y`.
- No aparecen textos técnicos ni QA.

## Notas técnicas

No requiere migración de base de datos. Es una mejora de presentación y estandarización de salida PDF.

## Ajuste posterior de recorrido

Durante el recorrido visual se detectó que:

- Ventas tenía exportación Excel pero no descarga PDF.
- Ventas necesitaba filtro por rango de fechas para consultar períodos como ventas del mes.
- Compras tenía descarga PDF, pero no filtro por rango de fechas.

Se agregó:

- Botón PDF en `/dashboard/ventas` usando el generador comercial compartido.
- Filtro `Desde / Hasta` en `/dashboard/ventas`.
- Filtro `Desde / Hasta` en `/dashboard/compras`.
- Métricas superiores recalculadas sobre el resultado filtrado por estado, búsqueda y rango de fechas.
- Exportación PDF/Excel basada en el listado filtrado visible.

## Recorrido adicional

1. `/dashboard/ventas`: filtrar desde/hasta, validar tarjetas y descargar PDF.
2. `/dashboard/ventas`: limpiar fechas y validar que vuelve el historial completo.
3. `/dashboard/compras`: filtrar desde/hasta, validar tarjetas y descargar PDF.
4. `/dashboard/compras`: limpiar fechas y validar que vuelve el historial completo.
