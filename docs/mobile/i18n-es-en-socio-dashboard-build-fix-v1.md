# i18n ES/EN socio dashboard build fix v1

## Rama

`feature/i18n-es-en-socio-dashboard-v1`

## Objetivo

Corregir un error de build detectado durante la validación local de la internacionalización del dashboard del socio.

## Problema detectado

`npm run build` fallaba en `src/components/dashboard/DashboardInitialContent.tsx` porque el componente auxiliar `SocioMobileQuickActionRail`, declarado fuera del componente principal, intentaba usar `t(...)` sin tener acceso al hook `useI18n()`.

Error:

```txt
Type error: Cannot find name 't'.
```

## Solución aplicada

- Se mantuvo `useI18n()` únicamente dentro de `DashboardInitialContent`.
- `SocioMobileQuickActionRail` ahora recibe los textos traducidos por props:
  - `eyebrow`
  - `title`
- Se evita llamar hooks o traductores desde un helper externo sin contexto.

## Alcance

- No toca DB.
- No toca endpoints.
- No toca Swagger/OpenAPI.
- No cambia comportamiento funcional.
- Solo corrige el build de la feature i18n del dashboard socio.

## Archivo modificado

- `src/components/dashboard/DashboardInitialContent.tsx`
