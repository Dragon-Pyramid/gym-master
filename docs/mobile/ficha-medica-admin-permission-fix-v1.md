# Ficha médica admin permission fix v1

## Contexto

Durante la validación de `feature/ficha-medica-admin-review-polish-v1` se detectó que la ruta `/dashboard/ficha-medica` seguía definida como permiso exclusivo del rol `socio`.

Como consecuencia:

- el ítem **Ficha Médica** no aparecía en el menú del administrador;
- al ingresar por URL directa, el `DashboardRouteGuard` mostraba el cartel de acceso denegado;
- la UI de revisión administrativa no podía ser validada aunque el componente ya estuviera preparado para roles `admin` y `usuario`.

## Ajuste aplicado

Se actualizó la definición de permisos de menú para que **Ficha Médica** sea accesible por:

- `admin`;
- `usuario`;
- `socio`.

También se incorporó **Ficha Médica** al set de permisos por defecto del rol `usuario`, para que el módulo pueda habilitarse en perfiles administrativos operativos.

## Alcance

Archivo modificado:

- `src/lib/permissions/menuPermissions.ts`

No se modificaron endpoints, base de datos, Swagger ni lógica clínica.

## QA sugerido

1. Iniciar sesión como administrador.
2. Confirmar que aparece el ítem **Ficha Médica** en el menú.
3. Entrar a `/dashboard/ficha-medica` desde el menú.
4. Entrar a `/dashboard/ficha-medica` por URL directa.
5. Confirmar que ya no aparece el cartel de acceso denegado.
6. Repetir el flujo con socio para asegurar que sigue viendo su propia ficha.
