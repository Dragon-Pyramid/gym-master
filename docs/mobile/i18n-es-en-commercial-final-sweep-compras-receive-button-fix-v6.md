# i18n ES/EN commercial final sweep compras receive button fix v6

## Objetivo
Corregir el texto restante visible en Español dentro de `/dashboard/comercial/compras-reposicion`.

## Problema
El fix v5 agregó la clave de traducción para `Recibir cantidades`, pero el JSX del botón quedó como texto literal porque estaba separado por ícono y saltos de línea.

## Ajustes
- El botón de órdenes abiertas ahora renderiza `{c('Recibir cantidades')}`.
- En Inglés se muestra como `Receive quantities`.
- El destino de la orden ahora traduce también el valor de ubicación:
  - `Depósito` → `Warehouse`.

## Alcance
- Solo frontend/i18n.
- No toca DB.
- No toca endpoints.
- No toca Swagger/OpenAPI.
