# HTTP Runtime Hardening — Login Error Mapping Hotfix

## Contexto

Durante la validación manual del rate limiting de `POST /api/custom-login`, las primeras veinte solicitudes con un correo inexistente respondieron `500`, aunque la solicitud número veintiuno fue limitada correctamente con `429`.

## Causa raíz

La consulta de usuario utilizaba `.single()`. Supabase devuelve un error cuando la consulta no encuentra filas, por lo que el flujo clasificaba una credencial inexistente como una falla interna de base de datos antes de alcanzar la validación `!data`.

## Corrección

- La consulta utiliza `.maybeSingle()` para representar correctamente la ausencia de usuario con `data = null` y sin error de proveedor.
- Un correo inexistente continúa usando la respuesta genérica `LOGIN_INVALID_CREDENTIALS` con estado `401`.
- Los errores reales de consulta siguen respondiendo `500`, pero el log registra únicamente el código estructurado y no el mensaje interno de Supabase.
- Se retiraron logs específicos de correo, contraseña y rol inválidos para reducir información sensible en registros operativos.
- El gate `test:http-runtime-security` verifica que esta regresión no vuelva a introducirse.

## Resultado esperado

Con el servidor reiniciado para limpiar el bucket local de rate limiting:

- Solicitudes 1 a 20 con credenciales inválidas: `401 Unauthorized`.
- Solicitud 21 dentro de la misma ventana: `429 Too Many Requests`.
- Una falla real del proveedor o de conectividad: `500` con respuesta pública redactada.

## Alcance

No modifica base de datos, migraciones, RLS, RPC, contratos de sesión, permisos ni el límite configurado para login.
