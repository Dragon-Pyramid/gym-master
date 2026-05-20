# Gym Master — Corrección de flujo de rutinas: refresco y eliminación

## Contexto

Durante las pruebas funcionales del módulo Rutinas se detectaron dos problemas:

1. Al generar una rutina, el sistema mostraba el mensaje de éxito, pero el listado no se actualizaba automáticamente. La rutina recién aparecía al recargar manualmente la pantalla con F5.
2. Al eliminar una rutina, aparecía el diálogo de confirmación, pero luego de aceptar la rutina permanecía visible y no se eliminaba de la base.

## Objetivo de la rama

Corregir el flujo operativo de rutinas para que:

- Después de generar una rutina, el historial/listado se refresque automáticamente.
- La eliminación de una rutina ejecute una operación real contra el backend.
- El socio solo pueda eliminar sus propias rutinas.
- Un administrador pueda eliminar rutinas desde una vista global si corresponde.
- La UI muestre feedback correcto durante la eliminación.

## Cambios técnicos

### Frontend

- Se agregó un `refreshKey` en `src/app/dashboard/rutinas/page.tsx` para forzar la recarga del componente `RutinaDisplay` después de crear o eliminar una rutina.
- Se agregó un handler dedicado `handleDeleteRutina` para:
  - confirmar eliminación,
  - llamar a la API,
  - mostrar toast de éxito/error,
  - refrescar el historial.
- Se actualizó `src/components/dashboard/rutinas/RutinaDisplay.tsx` para:
  - aceptar `refreshKey`,
  - recargar el historial cuando cambia ese valor,
  - ejecutar correctamente `onDelete`,
  - mostrar estado `ELIMINANDO...` durante la operación.

### API Client

- Se agregó `eliminarRutina(idRutina)` en `src/services/apiClient.ts`.
- La función llama a `DELETE /api/rutina/:idRutina` con token JWT.

### Backend / API Route

- Se agregó soporte para `DELETE` en `src/app/api/rutina/[idSocio]/route.ts`.
- Aunque el segmento existente se llama `[idSocio]`, para `DELETE` se interpreta como `idRutina` por compatibilidad con la estructura de rutas actual.

### Servicio server-side

- Se agregó `src/services/server/rutinaServerService.ts`.
- Usa `getSupabaseServerClient()` para operar con service role desde backend.
- Valida:
  - que el id de rutina sea válido,
  - que la rutina exista,
  - que el socio logueado sea dueño de la rutina,
  - que un admin pueda eliminar si corresponde.

## Validaciones sugeridas

1. Iniciar sesión como socio.
2. Entrar a `Dashboard > Rutinas`.
3. Generar una rutina nueva.
4. Confirmar que aparece automáticamente sin presionar F5.
5. Eliminar una rutina.
6. Confirmar que desaparece automáticamente del listado.
7. Recargar la página y confirmar que la rutina eliminada no vuelve a aparecer.
8. Probar con rol administrador si corresponde.

## Notas

Esta rama no requiere migraciones de base de datos. Es una corrección de flujo frontend/backend sobre la tabla `rutina` existente.

