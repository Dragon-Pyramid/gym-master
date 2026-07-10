# i18n navigation menus final sweep v18 - dashboard non-blocking data load fix

## Objetivo

Evitar que `/dashboard` quede bloqueado en `Cargando dashboard...` por cargas auxiliares de métricas o datos operativos.

## Diagnóstico

El dashboard principal seguía bloqueando el render completo cuando `loadingDatos` era `true`:

```tsx
if (loadingDatos || !isInitialized) {
  return ...
}
```

Aunque las cargas ya tenían fail-open y timeout, ese estado seguía siendo un punto único de bloqueo visual.

## Ajuste quirúrgico

Se modifica solo la condición de bloqueo inicial:

```tsx
if (!isInitialized) {
  return ...
}
```

Esto significa:

- el dashboard solo espera a que la autenticación esté inicializada;
- las métricas/datos auxiliares cargan en segundo plano;
- si una métrica tarda o falla, la pantalla abre igual con estados iniciales seguros;
- no se modifica la lógica de negocio;
- no se modifica ningún endpoint;
- no se modifica DB;
- no se modifica Swagger/OpenAPI.

## Archivo modificado

- `src/app/dashboard/page.tsx`

## QA sugerido

1. Abrir `/dashboard`.
2. Confirmar que ya no queda bloqueado en `Cargando dashboard...`.
3. Validar que las cards carguen con valores iniciales o datos reales.
4. Revisar consola por errores reales de endpoints, sin bloqueo visual de la pantalla.
