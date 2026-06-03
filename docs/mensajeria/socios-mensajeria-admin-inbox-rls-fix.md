# Fix QA — Mensajería socio/admin y RLS

## Contexto

Durante la prueba funcional de `feature/socios-mensajeria-admin-inbox`, el socio podía ingresar a `/dashboard/mensajes`, pero al enviar un mensaje Supabase devolvía:

```txt
new row violates row-level security policy for table "socio_mensaje"
```

## Causa

Gym Master usa autenticación custom/JWT propio en `authMiddleware`. La tabla `socio_mensaje` puede tener RLS habilitado en Supabase, pero las policies de Supabase no reciben automáticamente el usuario del JWT custom de Gym Master.

El endpoint ya valida el usuario, rol y socio asociado desde backend. Por eso, para esta tabla operada exclusivamente por API Routes, las consultas deben ejecutarse con el cliente server-side `SUPABASE_SERVICE_ROLE_KEY`, no con el cliente anon.

## Corrección

Se actualizó `src/services/socioMensajeService.ts` para usar `getSupabaseServerClient()`.

El flujo de seguridad queda así:

1. El navegador llama a API Routes con el token custom de Gym Master.
2. `authMiddleware` valida la sesión/JWT.
3. El servicio resuelve el `socio_id` asociado al usuario.
4. El backend ejecuta la operación con service role.
5. No se expone `SUPABASE_SERVICE_ROLE_KEY` al frontend.

## Alcance

- No requiere migración nueva.
- No modifica contratos de API.
- No cambia UI.
- Corrige insert/list/update de mensajes bloqueados por RLS.
