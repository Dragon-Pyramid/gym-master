# i18n ES/EN commercial modules duplicates build fix v1

## Objetivo
Corregir el build de `feature/i18n-es-en-commercial-modules-v1` eliminando claves duplicadas en `src/i18n/commercialUi.ts`.

## Problema
TypeScript fallaba con:

```text
An object literal cannot have multiple properties with the same name.
```

## Ajuste
Se eliminaron entradas duplicadas dentro del diccionario de traducciones comerciales, conservando la primera aparición de cada clave.

## Claves duplicadas removidas
- `POS / Kiosco`
- `Caja / Cashup`

## Alcance
- No toca DB.
- No toca endpoints.
- No toca Swagger/OpenAPI.
- No cambia lógica de negocio.
