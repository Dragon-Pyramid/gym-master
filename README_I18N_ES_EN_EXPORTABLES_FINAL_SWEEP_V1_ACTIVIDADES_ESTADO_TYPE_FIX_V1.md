# I18N ES/EN Exportables - Actividades estado type fix v1

Corrige un error de compilación generado por traducir `turno.estado` dentro del formulario de edición de turnos.

## Error corregido

`Type error: Type 'string' is not assignable to type 'ActividadTurnoEstado'.`

## Qué hace

- En `handleEditTurno`, conserva `estado: turno.estado` para mantener el enum/tipo interno esperado por el formulario.
- En el export Excel de turnos, usa `estadoLabel(turno.estado, locale)` para que la salida visible sí quede traducida.

## Alcance

No modifica DB, endpoints, Swagger/OpenAPI ni lógica de cupos/inscripciones.
