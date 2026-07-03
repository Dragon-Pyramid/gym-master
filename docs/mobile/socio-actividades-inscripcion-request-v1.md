# Socio actividades inscripción request v1

## Rama

`feature/socio-actividades-inscripcion-request-v1`

## Objetivo

Habilitar el flujo mobile para que el socio pueda consultar actividades/turnos disponibles y enviar una solicitud de inscripción desde `/dashboard/actividades`, sin exponer el flujo operativo completo de administración.

## Cambios principales

- Se habilita `/dashboard/actividades` para rol `socio` en el sistema de permisos del dashboard.
- Se agrega una vista específica para socios dentro de la página de actividades.
- El socio puede ver:
  - turnos activos;
  - día y horario;
  - cupos disponibles;
  - instructor;
  - ubicación;
  - estado de su solicitud o inscripción.
- Se agrega acción `Solicitar inscripción` / `Solicitar lista de espera`.
- Las solicitudes del socio se registran como `lista_espera`, funcionando como estado pendiente para revisión administrativa.
- Se evita duplicar solicitudes activas para un mismo turno.
- Se ajusta el endpoint de inscripciones para que, cuando el usuario autenticado sea socio, use siempre su propio `id_socio`.
- Se limita la respuesta de inscripciones del dashboard para rol socio a sus propias solicitudes, conservando turnos/cupos necesarios para la agenda.
- Se actualiza la card mobile del dashboard socio para dirigir al módulo de actividades.
- Se actualiza Swagger por cambio de comportamiento en endpoints existentes.
- Se aplica shell vertical `Header / Contenido / Footer` para evitar espacio blanco posterior al footer.

## Archivos modificados

- `src/app/dashboard/actividades/page.tsx`
- `src/app/api/actividades/turnos-cupos/route.ts`
- `src/app/api/actividades/turnos-cupos/inscripciones/route.ts`
- `src/components/dashboard/socio/SocioMobileActividadesAgendaCard.tsx`
- `src/lib/permissions/menuPermissions.ts`
- `src/lib/swagger/openApiSpec.ts`

## Sin migración DB

La feature reutiliza las tablas y endpoints existentes de actividades, turnos, cupos e inscripciones. No agrega migraciones ni cambios de esquema.

## QA sugerido

### Socio

1. Entrar como socio a `/dashboard/actividades`.
2. Confirmar acceso autorizado.
3. Revisar turnos activos y cupos.
4. Buscar por actividad/turno/instructor/ubicación.
5. Filtrar por día.
6. Enviar solicitud de inscripción.
7. Confirmar que el estado queda como `Solicitud pendiente`.
8. Intentar repetir solicitud en el mismo turno y confirmar que no duplica.
9. Salir de F12 mobile y validar que no queda espacio blanco después del footer.

### Admin / usuario

1. Entrar a `/dashboard/actividades`.
2. Confirmar que el panel operativo sigue visible.
3. Revisar BI, turnos, inscripciones y catálogo.
4. Confirmar que una solicitud de socio aparece como lista de espera para revisión posterior.
5. Validar PDF/Excel y acciones existentes.
