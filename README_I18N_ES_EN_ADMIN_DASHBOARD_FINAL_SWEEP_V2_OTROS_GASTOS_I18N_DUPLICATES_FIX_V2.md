# I18N ES/EN Admin Dashboard Final Sweep V2 - Otros Gastos i18n duplicates fix v2

## Alcance

Corrige el error de build en `src/utils/otrosGastosI18n.ts` provocado por claves duplicadas dentro del objeto `enOtrosGastosUi`.

## Error corregido

```txt
Type error: An object literal cannot have multiple properties with the same name.
src/utils/otrosGastosI18n.ts
```

## Cambio

Se reemplaza `src/utils/otrosGastosI18n.ts` por la versión equivalente sin claves duplicadas. Mantiene las traducciones agregadas en los fixes previos de Otros Gastos.

No toca DB, endpoints, Swagger/OpenAPI ni lógica funcional.
