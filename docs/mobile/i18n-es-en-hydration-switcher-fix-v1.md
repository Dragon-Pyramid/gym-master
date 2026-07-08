# i18n ES/EN hydration switcher fix v1

## Rama

`feature/i18n-es-en-foundation-v1`

## Objetivo

Corregir el error de hidratación SSR/cliente detectado en el selector de idioma cuando el servidor renderizaba `ES` y el cliente resolvía `EN` desde `localStorage` o navegador.

## Problema detectado

En `/auth/login` y otras pantallas públicas podía aparecer:

```txt
Text content did not match. Server: "ES" Client: "EN"
```

El problema ocurría porque el idioma inicial se resolvía con `window/localStorage` durante el primer render del cliente, mientras que el servidor siempre partía desde Español.

## Cambios realizados

- `I18nProvider` ahora recibe `initialLocale` desde el layout.
- El primer render del servidor y del cliente usan el mismo idioma inicial.
- Después de hidratar, el provider resuelve la preferencia real del cliente desde:
  - `localStorage`;
  - cookie `gym-master-locale-v1`;
  - idioma/región del navegador.
- El idioma seleccionado se persiste también en cookie para que el servidor pueda renderizar la preferencia correcta en cargas posteriores.
- `LanguageSwitcher` evita mostrar un valor dinámico distinto antes de hidratar.
- `RootLayout` usa la cookie de idioma para inicializar `<html lang="...">`.

## Archivos modificados

- `src/app/layout.tsx`
- `src/components/SessionWrapper.tsx`
- `src/components/i18n/LanguageSwitcher.tsx`
- `src/i18n/config.ts`
- `src/i18n/I18nProvider.tsx`

## Alcance técnico

No modifica base de datos.
No agrega endpoints.
No modifica Swagger/OpenAPI.
No cambia lógica de autenticación.

## QA sugerido

1. Limpiar el error del navegador.
2. Ejecutar:

```js
localStorage.setItem('gym-master-locale-v1', 'en')
location.reload()
```

3. Entrar en `/auth/login`.
4. Confirmar que no aparece el overlay de hidratación.
5. Confirmar que el selector termina mostrando `EN`.
6. Cambiar a `ES` y recargar.
7. Confirmar que queda persistido.
8. Entrar a `/dashboard` y validar loaders en el idioma seleccionado.
