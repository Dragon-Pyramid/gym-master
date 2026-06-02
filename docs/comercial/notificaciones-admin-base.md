# Notificaciones admin base

Feature: `feature/notificaciones-admin-base`

## Objetivo

Crear la base operativa de notificaciones del sistema para Gym Master.

Esta base permite administrar avisos manuales o programados para socios, preparar envíos por email, registrar historial de destinatarios y dejar lista la salida futura en la Terminal de asistencia sin ocultar el QR.

## Alcance implementado

- Nueva pantalla `/dashboard/notificaciones`.
- Nuevo menú Administración → Notificaciones.
- Tablas:
  - `notificacion_plantilla`.
  - `notificacion`.
  - `notificacion_envio`.
- Plantillas seed:
  - feriado / horario especial,
  - promoción,
  - stock crítico,
  - cumpleaños.
- Filtros por estado, tipo, búsqueda y rango de fecha.
- Exportación Excel con timestamp.
- PDF membretado con timestamp.
- Historial de envíos por notificación.
- Acción para preparar/enviar a socios del segmento seleccionado.

## Salidas futuras

Esta feature deja base para:

- `feature/auth-forgot-password-email-flow`.
- `feature/terminal-publicidad-promociones-timer`.
- `feature/socios-mensajeria-admin-inbox`.
- `feature/soporte-dragon-pyramid-ticketing`.

## Nota técnica

El envío real por proveedor SMTP/API queda preparado a nivel de modelo e historial. En esta etapa se registra el envío en `notificacion_envio` y se marca la notificación como enviada, dejando la integración real con email transaccional para una feature posterior.
