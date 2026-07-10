# i18n navigation menus final sweep v17 - dashboard loading guard fix

## Objetivo

Evitar que `/dashboard` quede bloqueado indefinidamente en `Cargando dashboard...` si una métrica o consulta inicial falla o tarda demasiado.

## Problema

La carga inicial del dashboard admin esperaba varias fuentes:

- equipamientos;
- mantenimientos;
- métricas de rutinas;
- concurrencia;
- fallos;
- estado de equipamiento;
- segmentación e histograma de pagos.

Si alguna llamada fallaba o quedaba colgada, `loadingDatos` podía quedar en `true`.

## Ajuste

Se modifica solo `src/app/dashboard/page.tsx`:

- se agrega guard por `isInitialized` / `isAuthenticated`;
- se agrega `cancelled` para evitar setState después de desmontar;
- se envuelven las cargas iniciales en `Promise.allSettled`;
- se agrega timeout de 10s por llamada inicial;
- ante error/timeout, el dashboard abre con arrays vacíos en vez de quedar bloqueado;
- `loadingDatos` se libera siempre en `finally`.

## Alcance

- Solo frontend/dashboard loading guard.
- Sin cambios en DB.
- Sin cambios en endpoints.
- Sin cambios en Swagger/OpenAPI.
- Sin cambios visuales ni de layout.
- Sin cambios en la lógica de negocio de métricas: solo fail-open para no bloquear la pantalla.
