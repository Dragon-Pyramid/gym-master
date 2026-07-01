# Hotfix - Socio Mobile Actividades Agenda RBAC v1

## Objetivo

Corregir la navegación de la tarjeta mobile `Agenda del gimnasio` para que el socio no intente acceder al módulo administrativo de actividades.

## Contexto

La tarjeta mostraba correctamente actividades, turnos, horarios y cupos en el dashboard mobile del socio, pero sus botones y cada card de turno navegaban a `/dashboard/actividades`.

Ese módulo pertenece a la gestión administrativa de actividades y está habilitado para roles internos, no para el rol `socio`. Por eso el socio veía el mensaje `USTED NO TIENE ACCESO A ESTE MENÚ`.

## Cambios aplicados

- Se mantiene la tarjeta informativa de agenda en el home mobile del socio.
- Se elimina la navegación directa a `/dashboard/actividades` desde los turnos listados.
- Se reemplazan los accesos `Ver agenda` y `Actividades` por acciones hacia `/dashboard/mensajes`.
- Se actualizan textos para explicar que la inscripción, modificación de turnos o consulta de cupos debe gestionarse con administración.
- No se modifica RBAC.
- No se habilita el módulo administrativo de actividades para socios.
- No se modifica backend ni base de datos.

## Archivo modificado

- `src/components/dashboard/socio/SocioMobileActividadesAgendaCard.tsx`

## Validación sugerida

1. Iniciar sesión como socio desde mobile.
2. Abrir `/dashboard`.
3. Confirmar que la tarjeta `Agenda del gimnasio` muestra actividades y cupos.
4. Confirmar que tocar una actividad ya no navega a `/dashboard/actividades`.
5. Confirmar que los botones llevan a `/dashboard/mensajes`.
6. Confirmar que ya no aparece el mensaje `USTED NO TIENE ACCESO A ESTE MENÚ` desde esta tarjeta.

## Resultado esperado

El socio puede consultar la agenda de actividades desde el home mobile y contactar a administración para inscribirse o modificar un turno, sin acceder a módulos administrativos restringidos.
