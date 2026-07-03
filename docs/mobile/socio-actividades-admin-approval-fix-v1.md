# Gym Master — Socio actividades admin approval fix v1

## Feature

`feature/socio-actividades-inscripcion-request-v1`

## Motivo

Luego de habilitar la solicitud de inscripción desde el perfil socio, la solicitud quedaba registrada correctamente como `lista_espera`, pero en el panel administrativo la acción para aprobar/incorporar al socio al turno no era lo suficientemente clara.

## Cambios aplicados

- Se agrega bloque administrativo **Solicitudes pendientes** en `/dashboard/actividades`.
- Se muestran socios en `lista_espera` con actividad, turno, fecha de solicitud y cupos del turno.
- Se agrega acción explícita **Incorporar al turno**.
- Se agrega acción explícita **Cancelar solicitud**.
- En la tabla/listado de inscripciones recientes, los registros en `lista_espera` ahora muestran acciones claras en lugar de depender de botones genéricos de estado.
- El endpoint `PUT /api/actividades/turnos-cupos/inscripciones/{id}` valida cupo disponible antes de aprobar como `inscripto` o `asistio`.
- Se limita el uso por rol socio para que solo pueda cancelar su propia solicitud/inscripción, evitando escalamiento manual a `inscripto` desde cliente.
- Se actualiza Swagger por el cambio de comportamiento del endpoint de actualización de inscripción.

## Alcance

No se agregan tablas ni migraciones. Se reutiliza `actividad_turno_inscripcion.estado` con los estados existentes:

- `lista_espera`: solicitud pendiente de aprobación administrativa.
- `inscripto`: socio incorporado al turno.
- `cancelado`: solicitud o inscripción cancelada.

## QA sugerido

1. Ingresar como socio a `/dashboard/actividades`.
2. Solicitar inscripción a un turno.
3. Confirmar que la solicitud queda como `lista_espera`.
4. Ingresar como admin a `/dashboard/actividades`.
5. Revisar el bloque **Solicitudes pendientes**.
6. Presionar **Incorporar al turno**.
7. Confirmar que el socio pasa a estado `inscripto` y aumenta el conteo de inscriptos del turno.
8. Repetir con un turno sin cupo y confirmar que no permite aprobar sin cupo disponible.
9. Probar **Cancelar solicitud**.
10. Confirmar que el socio no puede cambiar su propia solicitud a `inscripto` desde el endpoint.
