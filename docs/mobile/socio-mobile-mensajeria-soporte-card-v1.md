# Socio mobile mensajería soporte card v1

## Objetivo

Agregar al dashboard mobile del socio una tarjeta de mensajería y soporte para que pueda comunicarse rápidamente con administración del gimnasio.

## Alcance

- Frontend mobile para rol socio.
- Reutiliza la ruta existente `/dashboard/mensajes`.
- Reutiliza el servicio existente `getMisMensajesSocio`.
- No modifica backend.
- No modifica base de datos.
- No altera la lógica de autenticación.

## Cambios realizados

- Se agregó el componente `SocioMobileMensajeriaSoporteCard`.
- Se integró la tarjeta en `DashboardInitialContent` dentro del bloque mobile del socio.
- Se muestran métricas simples de mensajes totales, pendientes y respondidos.
- Se muestra el último mensaje o respuesta disponible.
- Se agregaron CTA para enviar consulta y ver mensajes.
- Se contemplan estados de carga, error, sin mensajes, mensajes pendientes y respuestas disponibles.

## Validación sugerida

1. Ingresar como socio desde Android o vista mobile.
2. Abrir `/dashboard`.
3. Confirmar que aparece la tarjeta “Soporte del gimnasio”.
4. Tocar “Enviar consulta” y verificar navegación a `/dashboard/mensajes`.
5. Crear un mensaje desde la pantalla de mensajes.
6. Volver al dashboard y confirmar que el contador pendiente se actualiza.
7. Validar que admin y usuario interno no vean la tarjeta mobile del socio.

## Riesgo

Bajo. La feature es frontend only y consume servicios ya existentes.
