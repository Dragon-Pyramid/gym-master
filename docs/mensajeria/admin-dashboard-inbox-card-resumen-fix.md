# Ajuste Dashboard Admin — Resumen de mensajes sin responder

## Rama

`feature/socios-mensajeria-admin-inbox`

## Objetivo

Corregir la card **Bandeja de entrada** del dashboard principal para que no dependa de la respuesta completa de `/api/admin/socios-mensajes`.

## Cambio aplicado

Se agrega el endpoint:

```txt
GET /api/admin/socios-mensajes/resumen
```

Devuelve:

```json
{
  "data": {
    "total": 2,
    "nuevos": 0,
    "sin_responder": 1
  }
}
```

## Criterio funcional

- `nuevos`: mensajes en estado `pendiente`.
- `sin_responder`: mensajes en estado `pendiente` o `leido`.
- `respondido` y `cerrado` no cuentan como sin responder.

## Motivo

Un mensaje puede pasar de `pendiente` a `leido` cuando administración lo abre, pero todavía necesita respuesta. Por eso la card debe mostrar también los mensajes leídos sin respuesta.
