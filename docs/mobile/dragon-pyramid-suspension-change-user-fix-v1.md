# Dragon Pyramid suspension change user fix v1

## Objetivo

Corregir la acción **Cambiar usuario** en la pantalla de suspensión operativa de Gym Master.

## Problema detectado

Cuando la licencia estaba suspendida, la pantalla de bloqueo ofrecía el botón **Cambiar usuario** como un enlace simple a `/auth/login`. Al existir una sesión activa/cacheada, el login podía quedar atrapado en el mismo estado autenticado y volver al dashboard bloqueado.

## Solución aplicada

- Reemplazo del enlace simple por un botón con acción explícita.
- Ejecución de `logout()` del store de autenticación antes de redirigir.
- Limpieza de sesión/cookie/localStorage mediante el flujo existente `logoutSession()`.
- Redirección controlada a `/auth/login` usando `router.replace()`.

## Alcance

- No modifica DB.
- No modifica endpoints.
- No modifica Swagger.
- No altera el acceso reservado Master Admin.
- No cambia la lógica de suspensión/reactivación.

## QA sugerido

1. Suspender licencia.
2. Entrar como admin o socio operativo.
3. Confirmar pantalla de suspensión.
4. Presionar **Cambiar usuario**.
5. Confirmar que vuelve a `/auth/login` sin sesión previa activa.
6. Iniciar sesión con otro usuario.
7. Confirmar que no queda trabado por credenciales cacheadas.
