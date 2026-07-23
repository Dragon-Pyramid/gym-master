# PWA cache strategy final hardening v1 — verifier formatting hotfix v1d

## Problema

El verificador buscaba literalmente `navigator.serviceWorker.register(` en una sola línea. El registrador válido del App Router usa encadenamiento multilínea:

```ts
navigator.serviceWorker
  .register(...)
```

La PWA se registraba, instalaba y ejecutaba correctamente, pero `npm run test:pwa-cache` producía un falso negativo.

## Solución

Se reemplazó la comparación literal por una expresión regular tolerante a espacios y saltos de línea. Las demás comprobaciones de seguridad permanecen intactas.

## Alcance

- `scripts/verify-pwa-cache-policy.mjs`
- Sin cambios en `next.config.js`.
- Sin cambios en el service worker.
- Sin cambios en cachés, APIs, autenticación, base de datos o lógica comercial.
