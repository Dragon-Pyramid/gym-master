# i18n ES/EN commercial final sweep proveedores loading loop fix v12

## Objetivo
Corregir un loop de carga en `/dashboard/proveedores`.

## Problema
Luego de internacionalizar la pantalla, el helper `c()` se declaraba inline dentro del componente:

```ts
const c = (text: string) => translateCommercialUi(locale, text);
```

`loadProveedores()` dependía de `c` y el `useEffect` dependía de `loadProveedores`.
Como `c` se recreaba en cada render, también se recreaba `loadProveedores`, disparando nuevamente el `useEffect`.

Síntoma visible:
- La tabla quedaba en loading.
- Parecía que el endpoint no terminaba de traer proveedores.
- En realidad se estaba reintentando la carga por render loop.

## Ajuste
- `c` ahora se memoiza con `useCallback`.
- `loadProveedores` deja de cambiar en cada render.
- No se modifica `getAllProveedores`.
- No se modifica endpoint.
- No se modifica DB.

## Alcance
- Solo frontend/i18n/React hooks.
- No toca DB.
- No toca endpoints.
- No toca Swagger/OpenAPI.
