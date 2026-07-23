# PWA cache strategy final hardening v1 — App Router registration and precache hotfix v1c

## Diagnóstico

La generación de `public/sw.js` era correcta, pero el navegador dejaba el service worker en estado `redundant` durante la instalación. Workbox intentaba precachear `/_next/app-build-manifest.json`, una URL que respondía `404` bajo `next start`. Una sola entrada fallida invalida la instalación completa del nuevo service worker.

Además, `next-pwa@5.6.0` no incorporaba de forma confiable su autorregistro en la entrada `main-app` del App Router. El registro manual desde DevTools demostraba que `/sw.js` era accesible, pero esa intervención no podía formar parte del flujo de producción.

## Cambios

- `next.config.js`
  - desactiva el autorregistro heredado con `register: false`;
  - excluye `app-build-manifest.json` del precache mediante `buildExcludes`;
  - mantiene las reglas endurecidas de runtime caching.
- `PwaServiceWorkerRegistrar.tsx`
  - registra `/sw.js` globalmente en producción;
  - usa scope `/` y `updateViaCache: 'none'`;
  - no se ejecuta durante `next dev`.
- `SessionWrapper.tsx`
  - monta el registrador en todas las rutas, incluidas autenticación y dashboard.
- `verify-pwa-cache-policy.mjs`
  - valida el registrador explícito;
  - rechaza la reaparición de `/_next/app-build-manifest.json` en `public/sw.js`.

## Seguridad y alcance

No se modifican APIs, autenticación, autorización, base de datos, RLS, RPC ni reglas comerciales. El cambio se limita al ciclo de instalación del service worker y conserva `NetworkOnly` para APIs y navegaciones.

## QA esperado

1. Ejecutar `npm run build && npm run test:pwa-cache`.
2. Iniciar con `npm run start`.
3. Eliminar el registro `redundant` previo y limpiar Cache Storage una sola vez.
4. Recargar `/auth/login`.
5. Confirmar en DevTools que `/sw.js` queda `activated and running`, scope `/`.
6. Confirmar que Console no muestra `bad-precaching-response` para `app-build-manifest.json`.
