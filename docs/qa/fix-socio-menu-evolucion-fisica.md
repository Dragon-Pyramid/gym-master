# Fix — Menú socio: Evolución Física

## Rama

`fix/socio-menu-evolucion-fisica`

## Objetivo

Agregar el acceso **Evolución Física** al menú lateral del socio, sin modificar el menú administrativo existente.

## Contexto

El panel de administración ya cuenta con el acceso general:

- `Gestión Evolución Física`
- Ruta: `/dashboard/gestor-evolucion-fisica`

Ese flujo permite seleccionar un socio y consultar su evolución física desde administración.

El socio, en cambio, necesita un acceso personal directo a su propia evolución:

- `Evolución Física`
- Ruta: `/dashboard/evolucion-fisica`

## Cambios aplicados

- Se agrega el ítem `Evolución Física` dentro de `Menú Personal` del sidebar.
- El enlace apunta a `/dashboard/evolucion-fisica`.
- Se mantiene intacto el ítem administrativo `Gestión Evolución Física`.
- Se ajusta el permiso del ítem personal `Evolución Física` para que sea exclusivo del rol `socio`.

## Archivos modificados

- `src/components/sidebar/sidebarConfig.ts`
- `src/lib/permissions/menuPermissions.ts`

## Impacto técnico

- No requiere migración de base de datos.
- No modifica endpoints.
- No requiere actualización de Swagger/OpenAPI.
- No toca el flujo administrativo de evolución física.

## Validación sugerida

1. Ingresar como socio.
2. Verificar que aparezca `Evolución Física` en `Menú Personal`.
3. Entrar a `/dashboard/evolucion-fisica`.
4. Confirmar que el socio ve su propia evolución física.
5. Ingresar como admin.
6. Confirmar que sigue apareciendo `Gestión Evolución Física`.
7. Confirmar que el menú administrativo no fue modificado.
8. Ejecutar `npm run build`.
