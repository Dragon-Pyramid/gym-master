# Dragon Pyramid Master Admin footer whitespace fix v1

## Objetivo

Corregir el espacio en blanco posterior al footer en la pantalla interna:

- `/dashboard/masteradmin/license`

## Ajuste aplicado

Se ajustó el shell visual de la página Master Admin para trabajar con altura fija de viewport (`100dvh`) y scroll interno controlado en el área de contenido.

Cambios principales:

- `main` pasa de `min-h-[100dvh]` a `h-[100dvh] max-h-[100dvh] overflow-hidden`.
- El contenido central queda como área scrollable (`overflow-y-auto`).
- Header y footer quedan fuera del scroll de contenido.
- El footer queda envuelto en un contenedor `shrink-0`.
- Se mantiene el responsive mobile ya corregido.

## Alcance

No modifica:

- DB.
- Endpoints.
- Swagger.
- Login Master Admin.
- Secret de sincronización.
- Lógica de licencia.

## QA sugerido

1. Entrar a `/auth/login/masteradmin`.
2. Iniciar sesión como `masteradmin`.
3. Validar redirección a `/dashboard/masteradmin/license`.
4. Activar F12 mobile.
5. Bajar al footer.
6. Confirmar que no queda espacio blanco debajo del footer.
7. Volver a desktop y repetir.
8. Ejecutar `npm run build`.
