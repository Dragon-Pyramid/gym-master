# Gym Master — Infraestructura / Equipamientos Maintenance Redesign v1

## Rama

`feature/infraestructura-equipamientos-maintenance-redesign`

## Objetivo

Rediseñar la primera capa del módulo **Infraestructura / Equipamientos** para pasar de un inventario operativo básico a una vista técnica más profesional, alineada con mejores prácticas CMMS, asset management y mantenimiento preventivo.

Esta fase no modifica la base de datos. Usa los datos existentes de `equipamiento`, alertas y BI de mantenimiento para construir una capa nueva de lectura, análisis y priorización.

## Alcance incluido

- Radar técnico del parque de máquinas.
- Score heurístico de riesgo por equipo.
- Clasificación de riesgo: bajo, medio, alto y crítico.
- Acciones sugeridas para mantenimiento preventivo/correctivo.
- Nueva columna `Riesgo` en la tabla de equipamientos.
- Priorización por estado, próxima revisión, recomendaciones de reemplazo, correctivos y costos recientes.
- Documentación funcional del rediseño base.

## Reglas de cálculo del radar técnico

El score de riesgo se calcula en frontend a partir de datos existentes:

- Equipo `fuera de servicio`: incremento alto de riesgo.
- Equipo `en mantenimiento`: incremento medio.
- Próxima revisión vencida: incremento alto.
- Próxima revisión dentro de 5 días: incremento alto/urgente.
- Próxima revisión dentro de 30 días: incremento preventivo.
- Equipo sin fecha de próxima revisión: incremento por falta de trazabilidad.
- Recomendación de reemplazo desde BI: incremento por costo/frecuencia.
- Correctivos repetidos en 180 días: incremento por posible falla recurrente.
- Costo reciente de mantenimiento: incremento progresivo.

## Resultado esperado de UX

La pantalla `/dashboard/equipamientos` ahora permite ver rápidamente:

- Cantidad de equipos con riesgo alto o crítico.
- Preventivos urgentes o vencidos.
- Equipos sin próxima revisión cargada.
- Top 5 equipos con mayor score técnico.
- Recomendaciones operativas para reducir downtime y costos.

## Buenas prácticas tomadas del benchmark

- CMMS / Atlas: work orders, downtime, costos, estado operativo y priorización.
- OCA Maintenance / Repair: separación conceptual entre preventivo, correctivo y reparación.
- Snipe-IT / Shelf: tracking de activos, ubicación, ficha técnica y ciclo de vida.
- InvenTree / Part-DB: futura integración con repuestos y stock mínimo.
- AWS/Azure/Snowflake Predictive Maintenance: base conceptual para evolucionar luego a riesgo predictivo/IA.

## Decisión técnica

No se agregan migraciones en esta v1 para evitar ampliar el alcance y para aprovechar el modelo existente. La mejora es compatible con la base actual y prepara el camino para las próximas fases:

1. Planes preventivos por tipo de máquina.
2. Órdenes técnicas avanzadas.
3. Repuestos, stock mínimo y costos.
4. Downtime y BI profundo.
5. QR por equipo.
6. Predicción heurística/IA de fallas.

## Validación sugerida

1. Ejecutar `npm run build`.
2. Entrar a `/dashboard/equipamientos` como admin.
3. Verificar que aparece el bloque **Radar técnico del parque**.
4. Verificar que la tabla muestra la columna **Riesgo**.
5. Probar filtros, búsqueda, PDF/Excel y modal de alta/edición.
6. Confirmar que no se tocaron migraciones ni scripts SQL.
