# i18n ES/EN socio dashboard dictionaries build fix v1

## Rama

`feature/i18n-es-en-socio-dashboard-v1`

## Objetivo

Corregir un error de compilación TypeScript detectado durante `npm run build` en `src/i18n/dictionaries.ts`.

## Problema detectado

El build fallaba con:

```text
An object literal cannot have multiple properties with the same name.
```

La clave `socioDashboard.payments` había quedado duplicada dentro del diccionario `es`.

## Corrección aplicada

- Se removió el bloque duplicado de `payments` dentro de `es.socioDashboard`.
- Se preservó el bloque correcto en Español.
- Se ubicó el bloque de `payments` en Inglés dentro de `en.socioDashboard`, donde corresponde.

## Alcance técnico

Archivo modificado:

- `src/i18n/dictionaries.ts`

## Impacto

- No modifica DB.
- No modifica endpoints.
- No modifica Swagger/OpenAPI.
- No cambia lógica funcional del dashboard.
- Corrige únicamente la estructura de diccionarios i18n para que TypeScript compile correctamente.

## Validación sugerida

```bash
npm run build
```

Luego validar `/dashboard` como socio en ES/EN, especialmente la card de pagos y recibos.
