# Hotfix Socio Mobile E2E Playwright Device v1

## Rama

`feature/socio-mobile-e2e-final-qa-v1`

## Motivo

Durante la ejecución de `npm run test:e2e -- e2e/socio-mobile-final-qa.spec.ts`, Playwright reportó el error:

```txt
Cannot use({ defaultBrowserType }) in a describe group, because it forces a new worker.
```

El problema se originaba porque `devices['iPhone 12 Pro']` incluye la propiedad `defaultBrowserType`, y esa opción no puede declararse dentro de `test.describe()`.

## Corrección

- Se extrajo `defaultBrowserType` del perfil `iPhone 12 Pro`.
- Se mantuvo la emulación mobile mediante viewport, userAgent, isMobile, hasTouch y deviceScaleFactor.
- Se movió `test.use()` a nivel superior del archivo.
- No se modificó lógica de negocio ni rutas probadas.

## Archivo modificado

- `e2e/socio-mobile-final-qa.spec.ts`

## Validación

```bash
export E2E_SOCIO_EMAIL="celsosoria2026@gmail.com"
export E2E_SOCIO_PASSWORD="GymMaster2026!"
npm run test:e2e -- e2e/socio-mobile-final-qa.spec.ts
```

La advertencia de `baseline-browser-mapping` no bloquea la ejecución del test; es solo un aviso de dependencia desactualizada.
