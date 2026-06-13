# Gym Master — Actividades, turnos y cupos

## Rama

`feature/actividades-turnos-cupos`

## Objetivo

Convertir el módulo de Actividades en una herramienta operativa real para gimnasios, permitiendo gestionar clases, horarios, cupos, inscripciones, lista de espera y asistencia por turno.

## Alcance funcional

- Dashboard de KPIs para actividades, turnos, cupos, inscriptos, lista de espera y ocupación promedio.
- BI visual con gráficos de turnos por día, inscripciones por estado e inscriptos por actividad.
- Gestión de turnos por actividad:
  - actividad base
  - nombre del turno
  - día de semana
  - hora de inicio y fin
  - cupo máximo y cupo mínimo
  - instructor opcional
  - ubicación/zona/sala
  - estado operativo: activo, pausado o cancelado
  - vigencia desde/hasta
  - observaciones
- Inscripción de socios a turnos.
- Derivación automática a lista de espera cuando el cupo está completo.
- Acciones rápidas sobre inscripción: inscripto, lista de espera, asistió, ausente o cancelado.
- Filtros por día, estado y búsqueda libre.
- Exportación Excel con hojas de actividades, turnos e inscripciones.
- PDF ejecutivo de turnos y cupos.
- Swagger/OpenAPI actualizado para endpoints nuevos.

## Endpoints

- `GET /api/actividades/turnos-cupos`
- `POST /api/actividades/turnos-cupos/turnos`
- `PUT /api/actividades/turnos-cupos/turnos/{id}`
- `DELETE /api/actividades/turnos-cupos/turnos/{id}`
- `POST /api/actividades/turnos-cupos/inscripciones`
- `PUT /api/actividades/turnos-cupos/inscripciones/{id}`
- `DELETE /api/actividades/turnos-cupos/inscripciones/{id}`

## Base de datos

La feature requiere migración privada de base de datos para crear:

- `public.actividad_turno`
- `public.actividad_turno_inscripcion`

El archivo de migración se entrega como material privado en:

`database/private/20260610-db-private-actividades-turnos-cupos.sql`

No debe commitearse al repo público si la política vigente del proyecto mantiene migraciones SQL fuera del repositorio principal.

## Validación QA sugerida

1. Restaurar QA local con `E:\gym-master-2026\sistema\gm-db-qa-lab\gm-db-qa-restore.sh`.
2. Aplicar la migración privada en Supabase local/QA.
3. Ejecutar `npm run build`.
4. Iniciar app local.
5. Abrir `/dashboard/actividades`.
6. Verificar dashboard de KPIs.
7. Crear turno para una actividad.
8. Inscribir socios hasta completar cupo.
9. Confirmar que el socio siguiente pase a lista de espera.
10. Marcar asistencia/ausencia/cancelación.
11. Exportar Excel.
12. Descargar PDF.
13. Verificar Swagger/OpenAPI.

## Observaciones

La pantalla mantiene compatibilidad con el catálogo histórico de `actividad`. Si la migración de turnos/cupos todavía no fue aplicada, el endpoint devuelve `schema_ready: false` y la UI muestra una advertencia sin romper el módulo existente.

## Ajuste UX selector de socios

Se refinó el bloque de inscripción de socios para evitar depender únicamente de un `<select>` largo. El formulario ahora permite buscar por nombre o DNI, seleccionar desde una lista filtrada, ver el socio seleccionado y conservar un selector rápido como alternativa. Este ajuste mejora la operación diaria en gimnasios con muchos socios registrados.
