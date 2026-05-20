# PR: Corrección de refresco y eliminación de rutinas

## Descripción

Este PR corrige dos problemas funcionales detectados durante las pruebas del módulo Rutinas de Gym Master:

1. Al generar una rutina, el sistema mostraba el mensaje de éxito, pero el listado no se actualizaba automáticamente. La rutina recién aparecía al recargar manualmente la pantalla con F5.
2. Al eliminar una rutina, aparecía el mensaje de confirmación, pero la operación no eliminaba realmente la rutina ni actualizaba el listado.

Con este cambio, el flujo de rutinas queda más consistente para el socio y más preparado para uso real en producción.

## Cambios principales

### Frontend

- Se agrega un mecanismo de refresco controlado mediante `refreshKey` en la página de rutinas.
- El componente `RutinaDisplay` ahora recarga el historial cuando se crea o elimina una rutina.
- Se agrega feedback visual durante la eliminación con el estado `ELIMINANDO...`.
- Se mantiene el modal de confirmación antes de eliminar.
- Se muestran mensajes de éxito/error con `toast`.

### API Client

- Se agrega la función `eliminarRutina(idRutina)` en `src/services/apiClient.ts`.
- La función consume `DELETE /api/rutina/:idRutina` enviando el JWT del usuario autenticado.

### Backend

- Se agrega soporte para `DELETE` en la ruta `src/app/api/rutina/[idSocio]/route.ts`.
- Se agrega el servicio server-side `src/services/server/rutinaServerService.ts`.
- La eliminación se ejecuta desde backend usando Supabase server-side/service role.
- Se valida que:
  - la rutina exista,
  - el id sea válido,
  - el socio solo elimine sus propias rutinas,
  - el administrador pueda eliminar rutinas si corresponde.

## Archivos modificados

- `src/app/dashboard/rutinas/page.tsx`
- `src/components/dashboard/rutinas/RutinaDisplay.tsx`
- `src/services/apiClient.ts`
- `src/app/api/rutina/[idSocio]/route.ts`
- `src/services/server/rutinaServerService.ts`
- `docs/rutinas/refresh-delete-flow.md`

## Validaciones sugeridas

- `npm run build`
- Login como socio.
- Generar rutina y verificar refresco automático del listado.
- Eliminar rutina y verificar que desaparezca sin recargar manualmente.
- Recargar la pantalla y verificar que la rutina eliminada no reaparezca.
- Probar autorización: un socio no debe poder eliminar rutinas de otro socio.
- Probar rol administrador si la vista lo permite.

## Notas

Este PR no agrega migraciones de base de datos. La corrección trabaja sobre la tabla `rutina` existente y sobre el flujo API/UI.
