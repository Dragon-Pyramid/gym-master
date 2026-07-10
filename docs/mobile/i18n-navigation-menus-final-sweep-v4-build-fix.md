# i18n navigation menus final sweep v4 build fix

## Objetivo

Corregir error de compilación en `DashboardInlineI18nSweep.tsx`.

## Error

Next/webpack reportaba:

```text
Expected ',', got 'string literal (Fin, 'Fin')'
```

## Causa

En el diccionario `TRANSLATIONS` quedó una entrada sin coma antes de:

```ts
'Fin': 'End'
```

## Ajuste

Se agrega la coma faltante y se normaliza la separación entre entradas del objeto.

## Alcance

- Solo build fix frontend.
- No toca DB.
- No toca endpoints.
- No toca Swagger/OpenAPI.
- No cambia lógica funcional.
