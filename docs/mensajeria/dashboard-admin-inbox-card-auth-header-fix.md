# Fix — Dashboard admin inbox card auth header

## Contexto
La card **Bandeja de entrada** del dashboard principal de administración mostraba `0` en mensajes sin responder aunque la bandeja `/dashboard/mensajes-admin` mostraba mensajes en estado `leido` sin respuesta.

## Causa
El dashboard consumía `GET /api/admin/socios-mensajes/resumen` sin enviar el header `Authorization: Bearer <token>`. El endpoint respondía `401` y el componente, por seguridad visual, mostraba `0`.

## Corrección
Se agregó lectura del token desde `storageService` y se envía el header `Authorization` al consultar el resumen.

## Resultado esperado
La card debe mostrar:

- `Nuevos / en espera`: mensajes en estado `pendiente`.
- `Sin responder`: mensajes en estado `pendiente` + `leido`.

