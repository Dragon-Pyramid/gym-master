# Socios - morosidad, desactivación automática y login

## Objetivo

Implementar una primera regla operativa para bloquear el ingreso normal de socios con mora mayor a 7 días.

## Regla de negocio

Cuando un usuario intenta iniciar sesión como socio:

1. Se validan email, contraseña y rol.
2. Se busca el socio asociado al usuario.
3. Se consulta el estado de cuota mediante `obtener_estado_cuota_socio`.
4. Si el estado es `vencido` y `dias_vencido > 7`:
   - se marca el socio como `activo = false`;
   - se carga `fecha_baja` con la fecha actual;
   - se bloquea el login normal;
   - se devuelve un mensaje claro para regularizar en administración.

Mensaje esperado:

```txt
Usted fue desactivado del sistema porque pasaron X días desde el vencimiento de su cuota. Diríjase a administración para regularizar su situación.
```

## Alcance técnico

### Backend

Archivos modificados:

```txt
src/services/loginService.ts
src/app/api/custom-login/route.ts
```

Cambios:

- Se agrega evaluación de morosidad durante login de socios.
- Se agrega desactivación automática de `socio.activo`.
- Se agregan códigos de error para login.
- El endpoint devuelve mensajes de error reales en lugar de respuesta genérica.

### Frontend

Archivo modificado:

```txt
src/app/auth/login/page.tsx
```

Cambios:

- El login muestra un cartel rojo inline cuando el acceso es restringido.
- El mensaje de desactivación por mora queda visible en la pantalla de login.
- Se conserva el comportamiento del toast.
- Se mantiene el toggle de contraseña agregado previamente.

### Swagger/OpenAPI

Archivo modificado:

```txt
src/lib/swagger/openApiSpec.ts
```

Cambios:

- Se actualiza la descripción de `POST /api/custom-login`.
- Se documentan estados 401 y 403.

## Fuera de alcance

- No separa todavía login de socio y login admin/usuario.
- No implementa RBAC/permisos de menú.
- No crea migraciones nuevas.
- No modifica tabla `usuario`.
- No implementa scheduler automático; la desactivación ocurre durante intento de login del socio.

## Validación sugerida

1. Socio al día:
   - puede iniciar sesión normalmente.

2. Socio vencido con menos o igual a 7 días:
   - puede iniciar sesión normalmente.

3. Socio vencido con más de 7 días:
   - no ingresa al dashboard;
   - se muestra cartel rojo en login;
   - `socio.activo` queda en `false`.

4. Admin/usuario interno:
   - login normal sin impacto por esta regla.


## Fix complementario: bloqueo de socios sin pagos

Durante la prueba funcional se detectó que la regla bloqueaba correctamente al socio vencido por más de 7 días, pero permitía ingresar a un socio con estado `sin_pagos`.

Se ajusta la regla del login para bloquear también a socios sin pagos activos.

### Regla actualizada

- `estado_cuota = 'vencido'` y `dias_vencido > 7`: bloquea login, desactiva socio.
- `estado_cuota = 'sin_pagos'`: bloquea login, desactiva socio.
- Socio al día: ingresa normalmente.
- Socio vencido dentro de tolerancia: ingresa normalmente.

### Mensaje para socio sin pagos

```txt
Usted fue desactivado del sistema porque no registra pagos activos. Diríjase a administración para regularizar su situación.
```
