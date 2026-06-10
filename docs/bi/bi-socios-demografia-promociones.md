# BI Socios / Demografía / Promociones

## Rama

`feature/bi-socios-demografia-promociones`

## Objetivo

Incorporar un dashboard de inteligencia comercial para analizar la base de socios del gimnasio y detectar oportunidades de promociones basadas en datos reales.

## Alcance funcional

- Nuevo endpoint `GET /api/socios/demografia-promociones-bi`.
- Nueva pantalla `/dashboard/bi-socios-demografia-promociones`.
- Filtros de fecha `desde` y `hasta`.
- Métricas de socios activos, distribución por género, edad promedio, altas, asistencia y consumo.
- Gráficos de género, franjas etarias, altas mensuales y asistencia por segmento.
- Resumen por franja etaria.
- Ranking de productos/servicios consumidos por segmento.
- Sugerencias de promociones comerciales por segmento.
- Exportación Excel.
- Exportación PDF con membrete comercial.
- Menú lateral y permisos para admin/usuario interno.

## Reglas de datos

- La demografía se calcula desde `socio.sexo`, `socio.fecnac`, `socio.fecha_alta` y `socio.activo`.
- La asistencia se segmenta por `asistencia.socio_id` y rango de fechas.
- Los pagos se segmentan desde `pago.socio_id`, pagos activos y estado pagado.
- El consumo se calcula desde ventas activas/pagadas asociadas a socios.
- Las ventas a consumidor final o visitante no se incluyen en segmentos de socios porque no tienen socio asociado.

## Validación recomendada

1. Entrar como administrador.
2. Abrir `BI Socios / Promociones` desde Administración.
3. Validar cards principales.
4. Cambiar rango de fechas y actualizar.
5. Verificar gráficos de género, franjas, altas y asistencia.
6. Revisar ranking de productos/servicios.
7. Revisar promociones sugeridas.
8. Exportar Excel.
9. Descargar PDF.
10. Ejecutar `npm run build`.

## Base de datos

No requiere migración. Usa tablas existentes.
