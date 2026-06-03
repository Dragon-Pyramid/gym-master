# Sincronización usuario ↔ socio

## Contexto

Durante la validación de `feature/auth-forgot-password-email-flow` se detectó que podía existir un `usuario` con rol `socio` sin un registro operativo vinculado en `public.socio`. En ese estado, el login socio encontraba el usuario y validaba la contraseña, pero fallaba al obtener el perfil del socio asociado.

## Regla implementada

Cuando se crea o actualiza un usuario con rol `socio`, el backend garantiza que exista un perfil operativo en `public.socio` asociado por `usuario_id`.

### Alta de usuario con rol socio

1. Se crea el usuario con la contraseña inicial temporal cuando corresponde.
2. Se conserva `must_change_password = true` si se usa la contraseña inicial.
3. Se busca un socio existente por DNI o email.
4. Si existe un socio con `usuario_id = null`, se vincula al usuario creado.
5. Si no existe socio, se crea automáticamente.
6. Si existe un socio con el mismo DNI o email vinculado a otro usuario, se devuelve un error claro.

## Sincronización de estado

- Si se desactiva un usuario socio desde Gestión de Usuarios, también se desactiva su registro en `socio`.
- Si se activa/desactiva un socio desde Gestión de Socios, también se activa/desactiva el `usuario` asociado.

## Alcance

Este ajuste no reemplaza la futura feature completa de normalización:

```txt
feature/auth-usuarios-socios-normalizacion
```

Solo corrige el circuito mínimo para evitar usuarios socio sin perfil operativo vinculado y mantener consistente el bloqueo de login por estado activo/inactivo.
