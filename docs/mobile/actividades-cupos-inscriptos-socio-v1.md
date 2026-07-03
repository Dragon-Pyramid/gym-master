# Actividades cupos inscriptos socio v1

## Rama

`feature/actividades-cupos-inscriptos-socio-v1`

## Objetivo

Pulir la experiencia del socio en el módulo de actividades para que pueda ver con claridad sus cupos, estado de inscripción, lista de espera y disponibilidad de cada turno desde mobile.

## Alcance funcional

- Se agrega el bloque **Mis cupos e inscripciones** en `/dashboard/actividades` para rol socio.
- Se muestran solicitudes e inscripciones activas del socio con estado claro:
  - solicitud pendiente;
  - inscripción aprobada;
  - asistencia registrada;
  - ausencia registrada.
- Se incorpora información del turno asociado:
  - actividad;
  - nombre de turno;
  - día y horario;
  - instructor;
  - ubicación;
  - cupos ocupados;
  - cupos libres;
  - lista de espera;
  - porcentaje de ocupación.
- Se agrega opción de cancelación para que el socio pueda cancelar una solicitud o inscripción propia.
- Las cards de actividades disponibles ahora muestran ocupación, inscriptos, cupos libres y lista de espera con mayor claridad.
- Se mejora la card mobile del dashboard socio para reflejar cupos/inscripciones activas y estados del socio.

## Seguridad y permisos

- No se agregan permisos nuevos.
- El endpoint ya limita el payload de inscripciones al socio autenticado cuando el rol es `socio`.
- La cancelación usa el endpoint existente `PUT /api/actividades/turnos-cupos/inscripciones/{id}`.
- La protección server-side ya impide que un socio cambie su estado a `inscripto`; solo puede cancelar su propia solicitud/inscripción.

## Archivos modificados

- `src/app/dashboard/actividades/page.tsx`
- `src/components/dashboard/socio/SocioMobileActividadesAgendaCard.tsx`

## Validación sugerida

1. Entrar como socio a `/dashboard/actividades`.
2. Confirmar bloque **Mis cupos e inscripciones**.
3. Solicitar inscripción a un turno.
4. Confirmar estado **Solicitud pendiente**.
5. Entrar como admin y aprobar la solicitud.
6. Volver como socio y confirmar estado **Inscripción aprobada**.
7. Revisar cupos ocupados/libres, lista de espera y porcentaje de ocupación.
8. Cancelar una solicitud o inscripción desde el socio.
9. Confirmar que el estado cambia y que desaparece de las activas.
10. Probar modo claro/oscuro y mobile/desktop.
11. Salir de F12 mobile y confirmar que no queda espacio blanco después del footer.

## Notas

No requiere migración de base de datos.
No modifica Swagger porque no cambia contrato de endpoints.
