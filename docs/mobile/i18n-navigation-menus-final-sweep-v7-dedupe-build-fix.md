# i18n navigation menus final sweep v7 - dedupe build fix

## Objetivo

Corregir error de TypeScript por claves duplicadas en `DashboardInlineI18nSweep.tsx`.

## Error

```text
Type error: An object literal cannot have multiple properties with the same name.
'STATUS DE CUOTA': 'FEE STATUS'
```

## Causa

Los fixes incrementales agregaron algunas traducciones ya existentes en el objeto `TRANSLATIONS`.

## Ajuste

- Se deduplican las claves del objeto `TRANSLATIONS`.
- Se conserva la última definición para que los fixes más recientes tengan prioridad.
- Se verifica que no queden claves duplicadas.

## Alcance

- Solo frontend/i18n build fix.
- No toca DB.
- No toca endpoints.
- No toca Swagger/OpenAPI.
- No cambia lógica funcional.
