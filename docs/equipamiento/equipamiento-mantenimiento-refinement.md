# Gym Master - Refinamiento de equipamiento y mantenimiento

## Objetivo

Mejorar el módulo de equipamiento para que deje de ser solo un listado operativo y pase a funcionar como una herramienta de mantenimiento preventivo, correctivo y decisión comercial.

## Alcance

- Paginación del listado de equipamientos.
- Búsqueda ampliada por nombre, marca, modelo, tipo, estado, ubicación y observaciones.
- Filtros por tipo, estado y ubicación con limpieza rápida.
- Exportación Excel respetando filtros activos.
- Métricas de mantenimiento y estado del parque.
- Gráficos de estado, costo mensual y distribución por tipo.
- Recomendaciones operativas para revisar reemplazo/venta de equipos con mantenimiento frecuente o costoso.
- Endpoint BI de mantenimiento: `GET /api/equipamientos/mantenimiento-bi`.
- Corrección lógica de mantenimiento completado para calcular próxima revisión usando la frecuencia configurada en `tipo_mantenimiento.frecuencia_dias` cuando exista.

## Criterio de mantenimiento

El mantenimiento de un equipo se interpreta como historial técnico del activo. Al registrar mantenimiento, el equipo pasa a estado `en mantenimiento`. Al completarlo, vuelve a `operativo`, se actualiza `ultima_revision` y se calcula `proxima_revision`.

Si el tipo de mantenimiento tiene `frecuencia_dias`, se usa esa frecuencia para la próxima revisión. Si no la tiene, se conserva un fallback de 3 meses.

## Métricas incorporadas

- Total de equipos activos.
- Equipos operativos.
- Equipos en mantenimiento.
- Equipos fuera de servicio.
- Revisiones vencidas.
- Revisiones próximas a 30 días.
- Equipos sin fecha de revisión.
- Costo total de mantenimiento.
- Costo de mantenimiento últimos 90 días.
- Correctivos últimos 90 días.
- Preventivos últimos 90 días.
- Equipos sugeridos para revisión de reemplazo.

## Recomendaciones de reemplazo

El endpoint calcula un score operativo/comercial considerando:

- Estado fuera de servicio.
- Estado en mantenimiento.
- Próxima revisión vencida o próxima.
- Cantidad de mantenimientos recientes.
- Cantidad de correctivos en últimos 180 días.
- Costo de mantenimiento en últimos 180 días.

El objetivo es ayudar al dueño del gimnasio a decidir si conviene mantener, reparar, vender o reemplazar un equipo.

## Base de datos

No requiere migración. Usa tablas existentes:

- `equipamiento`
- `mantenimiento`
- `tipo_mantenimiento`

## Validación sugerida

1. Abrir `/dashboard/equipamientos`.
2. Ver cards de mantenimiento y costos.
3. Ver gráficos de estado, costo mensual y tipo.
4. Probar búsqueda por nombre, marca y modelo.
5. Probar filtros por tipo, estado y ubicación.
6. Cambiar cantidad de registros por página.
7. Navegar paginación.
8. Exportar Excel con filtros activos.
9. Abrir un equipo.
10. Registrar mantenimiento.
11. Completar mantenimiento y verificar actualización de `ultima_revision` y `proxima_revision`.

## Swagger/OpenAPI

Se documenta el endpoint `GET /api/equipamientos/mantenimiento-bi` dentro del tag `Equipamiento`.

## Ajuste posterior de QA visual

Durante la revisión de interfaz se reemplazó la acción genérica **Imprimir** por **Descargar PDF**, porque el reporte debe ser un documento profesional y reutilizable para administración del gimnasio.

El PDF incluye:

- Resumen ejecutivo de métricas de equipamiento.
- Gráficos dibujados de estado del parque, costo mensual y equipos por tipo.
- Listado filtrado de equipamientos.
- Historial reciente de mantenimiento.
- Recomendaciones de venta/reemplazo cuando el costo o la frecuencia de mantenimiento justifican revisar el equipo.

También se reforzó la lógica de filtros para que **Tipo** y **Ubicación** se alimenten desde catálogos parametrizables. Esto es importante porque un gimnasio puede tener muchas zonas internas, sedes, pisos o sectores, y no conviene dejar esos valores como textos dispersos. Los estados del equipo se mantienen normalizados como valores operativos del sistema: `operativo`, `en mantenimiento` y `fuera de servicio`.

No requiere migración de base de datos: ya existen los catálogos `tipo_equipamiento`, `ubicacion_equipamiento` y `tipo_mantenimiento`.


## Ajuste PDF de tablas

- Se corrigió el contraste del encabezado de tablas del PDF para que los nombres de columnas se vean en blanco sobre fondo oscuro.
- Se repite el encabezado cuando una tabla continúa en una nueva página.
- Se agregan filas alternadas claras para mejorar la lectura del listado de equipamientos y el historial de mantenimiento.
