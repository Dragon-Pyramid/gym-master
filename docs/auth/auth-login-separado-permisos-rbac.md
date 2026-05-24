# Auth login separado y permisos RBAC base

## Objetivo

Separar el ingreso de socios del ingreso de administración y crear una primera base de permisos de menú por usuario.

## Alcance implementado

- `/auth/login` queda como pantalla de selección de acceso.
- `/auth/login/socio` permite ingreso directo de socios sin seleccionar tipo de usuario.
- `/auth/login/admin` permite ingreso de administradores y usuarios internos.
- Se conserva el ojo para mostrar/ocultar contraseña.
- Se agrega columna `usuario.permisos_menu` para guardar módulos habilitados.
- Se agrega UI de permisos en el alta/edición de usuarios.
- El sidebar se filtra según rol y permisos guardados en el JWT.
- El rol admin conserva control total.

## Consideraciones

Esta rama implementa RBAC base a nivel de interfaz/menú. En una fase posterior conviene reforzar guards por ruta y por endpoint para que el permiso no sea solo visual.

## Migración

Archivo:

```txt
supabase/migrations/202605241500_auth_login_rbac_foundation.sql
```

Agrega:

```txt
public.usuario.permisos_menu jsonb
```

## Validación local sugerida

```bash
npx supabase stop --no-backup
npx supabase start -x storage-api -x imgproxy -x studio -x logflare
docker exec -i supabase_db_gym-master psql -U postgres -d postgres < database/scripts/validar_auth_login_rbac_foundation.sql
npm run build
git restore public/sw.js public/workbox-*.js
git status
```

## Pruebas funcionales

1. Entrar a `/auth/login`.
2. Ver opciones separadas: socio y administración.
3. Entrar a `/auth/login/socio` y confirmar que no pide tipo de usuario.
4. Entrar a `/auth/login/admin` y confirmar que solo permite admin/usuario.
5. Crear o editar usuario interno.
6. Seleccionar permisos de menú.
7. Loguear como ese usuario y validar sidebar.
8. Confirmar que admin ve todo.
