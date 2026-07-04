# Dragon Pyramid Master Admin login redirect fix v1

## Objetivo

Corregir el comportamiento del login reservado `/auth/login/masteradmin` para que, luego de autenticar correctamente al rol `masteradmin`, redirija directamente al panel de licencia:

```txt
/dashboard/masteradmin/license
```

## Contexto

La pantalla `masteradmin` ya recibía la prop `successRedirectHref`, pero el submit del formulario compartido `GymMasterLoginForm` seguía redirigiendo siempre a `/dashboard` después de un login exitoso.

Para usuarios `masteradmin`, `/dashboard` no corresponde al flujo operativo y activa el guard de permisos mostrando el mensaje de acceso denegado para el módulo `Inicio`.

## Cambio aplicado

Se reemplazó la redirección fija:

```ts
router.push('/dashboard');
```

por la redirección configurable:

```ts
router.push(successRedirectHref);
```

## Impacto

- `/auth/login/masteradmin` redirige correctamente a `/dashboard/masteradmin/license`.
- Los logins normales siguen redirigiendo a `/dashboard`, porque ese valor es el default de `successRedirectHref`.
- No toca DB.
- No toca endpoints.
- No toca Swagger.
- No altera el control de sesión ya cacheada.

## QA sugerido

1. Cerrar sesión.
2. Entrar a `/auth/login/masteradmin`.
3. Iniciar sesión con usuario `masteradmin`.
4. Confirmar redirección directa a `/dashboard/masteradmin/license`.
5. Probar login normal `/auth/login` y confirmar que sigue entrando a `/dashboard`.
6. Probar que admin común y socio no acceden a `/dashboard/masteradmin/license`.
