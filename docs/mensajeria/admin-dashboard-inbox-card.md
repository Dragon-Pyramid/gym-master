# Mensajería socios — Card Bandeja de entrada en dashboard admin

## Objetivo

Agregar en el dashboard principal del administrador una card visible llamada **Bandeja de entrada**, mostrando la cantidad de mensajes de socios en estado `pendiente`.

## Alcance

- La card se muestra solo en el dashboard administrativo.
- Consulta `/api/admin/socios-mensajes?estado=pendiente`.
- Si no hay mensajes pendientes, muestra `0`.
- Si hay mensajes pendientes, muestra la cantidad.
- Al hacer clic en la card o en el botón **Abrir bandeja**, navega a `/dashboard/mensajes-admin`.
- Refresca la cantidad cada 60 segundos mientras el dashboard admin permanece abierto.

## Validación sugerida

1. Entrar como socio y crear un mensaje desde `/dashboard/mensajes`.
2. Entrar como admin y abrir `/dashboard`.
3. Confirmar que la card **Bandeja de entrada** muestra al menos `1`.
4. Abrir la bandeja desde la card.
5. Responder o cerrar el mensaje.
6. Volver al dashboard y confirmar que la cantidad se actualiza según los mensajes pendientes restantes.
