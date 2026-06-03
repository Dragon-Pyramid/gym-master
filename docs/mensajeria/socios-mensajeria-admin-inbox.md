# Socios Mensajería Admin Inbox

## Rama

`feature/socios-mensajeria-admin-inbox`

## Objetivo

Implementar una mensajería interna entre socios y administración del gimnasio.

## Alcance implementado

- Nueva bandeja personal para socios en `/dashboard/mensajes`.
- Nueva bandeja administrativa en `/dashboard/mensajes-admin`.
- Envío de consultas, críticas, reclamos, preguntas, sugerencias u otros mensajes desde el panel del socio.
- Estados operativos: `pendiente`, `leido`, `respondido`, `cerrado`.
- Administración puede leer, responder y cerrar mensajes.
- La respuesta queda visible para el socio.
- La respuesta se envía por email al socio mediante Brevo si el email está configurado.
- Nuevos permisos/menu para socio y administración.
- Endpoints documentados en Swagger/OpenAPI.

## Base de datos

Migración privada/no versionada:

`supabase/migrations/202606031730_socios_mensajeria_admin_inbox.sql`

Tabla nueva:

`public.socio_mensaje`

Script de validación:

`database/scripts/validar_socios_mensajeria_admin_inbox.sql`

## Pruebas recomendadas

1. Crear/usar un socio con login válido.
2. Entrar a `/dashboard/mensajes`.
3. Enviar mensaje a administración.
4. Entrar como admin a `/dashboard/mensajes-admin`.
5. Ver el mensaje pendiente.
6. Abrirlo y responder.
7. Confirmar que queda `respondido`.
8. Confirmar que el socio ve la respuesta.
9. Confirmar que Brevo registra el email si `BREVO_API_KEY` y sender están configurados.
10. Cerrar mensaje desde administración.

## Observaciones

Esta feature no reemplaza el futuro sistema de tickets Dragon Pyramid. La mensajería socio-admin es interna al gimnasio cliente.
