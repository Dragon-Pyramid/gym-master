# feature/soporte-dragon-pyramid-ticketing

## Objetivo

Implementar un canal de tickets desde administradores o usuarios internos del gimnasio cliente hacia Dragon Pyramid / Gym Master.

## Alcance funcional

- Nueva pantalla: `/dashboard/soporte-dragon-pyramid`.
- Nuevo menú: `Soporte Dragon Pyramid` dentro de Administración.
- Creación de tickets con categoría, prioridad, asunto, descripción y URL opcional de adjunto/captura.
- Estados: `pendiente`, `en_revision`, `respondido`, `cerrado`.
- Prioridades: `baja`, `media`, `alta`, `critica`.
- Categorías: `fallas`, `dudas`, `problemas`, `sugerencias`, `otros`.
- Historial de eventos del ticket.
- Envío de email transaccional a Dragon Pyramid cuando se crea un ticket.
- Trazabilidad de si el email fue enviado o si quedó pendiente por configuración.

## Variables de entorno

Para que el envío real funcione, además de la configuración Brevo existente, se debe definir al menos una de estas variables:

```env
DRAGON_PYRAMID_SUPPORT_EMAIL=soporte@dragonpyramid.com.ar
```

También se aceptan como fallback:

```env
GYM_MASTER_SUPPORT_EMAIL=
SUPPORT_EMAIL=
```

Se pueden indicar varios destinatarios separados por coma.

## Base de datos

Migración privada/no versionada:

```txt
supabase/migrations/202606050700_soporte_dragon_pyramid_ticketing.sql
```

Tablas:

- `soporte_ticket`
- `soporte_ticket_evento`

Script de validación:

```txt
database/scripts/validar_soporte_dragon_pyramid_ticketing.sql
```

## Seguridad

Las API routes validan JWT mediante `authMiddleware`. Las operaciones contra Supabase se realizan desde backend con service role mediante `getSupabaseServerClient()`, sin exponer la clave al frontend.

## Endpoints

- `GET /api/soporte/tickets`
- `POST /api/soporte/tickets`
- `GET /api/soporte/tickets/{id}`
- `PATCH /api/soporte/tickets/{id}`

## QA sugerido

1. Entrar como admin o usuario interno con permiso.
2. Abrir `/dashboard/soporte-dragon-pyramid`.
3. Crear ticket categoría `fallas`, prioridad `alta`.
4. Confirmar que aparece en el listado.
5. Confirmar que se crea historial.
6. Confirmar email a Dragon Pyramid si la variable está configurada.
7. Cambiar estado a `en_revision`.
8. Registrar comentario.
9. Marcar respondido.
10. Cerrar ticket.
