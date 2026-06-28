# PWA Offline & Update Experience v1

## Rama

`feature/pwa-offline-update-experience-v1`

## Objetivo

Mejorar la experiencia PWA de Gym Master cuando el socio usa la aplicación desde mobile o desde el modo instalado en Android/iOS.

## Alcance

- Detección de estado online/offline.
- Aviso discreto cuando se pierde conexión.
- Aviso de conexión recuperada.
- Detección de service worker con nueva versión disponible.
- Botón para actualizar la app cuando corresponde.
- Página `/offline` como fallback documental para navegación sin conexión.
- Fallback PWA de documento configurado en `next.config.js`.
- Experiencia visible únicamente para socio en mobile/PWA.

## Archivos modificados

- `next.config.js`
- `src/components/header/AppHeader.tsx`
- `src/components/pwa/PwaConnectionUpdateBanner.tsx`
- `src/app/offline/page.tsx`

## Decisiones técnicas

### Filtro por rol y contexto

El nuevo banner se monta desde `AppHeader`, pero internamente solo se muestra si:

- el usuario está autenticado,
- el rol normalizado es `socio`,
- el dispositivo es mobile o la app está corriendo en `display-mode: standalone`.

Esto evita molestar a administradores y usuarios internos en el panel web de escritorio.

### Online / offline

Se utilizan los eventos nativos del navegador:

- `online`
- `offline`
- `navigator.onLine`

Cuando el usuario queda sin conexión, se muestra un aviso persistente. Cuando la conexión vuelve, se muestra una confirmación temporal.

### Actualización PWA

Se observa el service worker registrado mediante:

- `navigator.serviceWorker.ready`
- `registration.updatefound`
- `registration.waiting`
- `controllerchange`

Cuando existe una nueva versión, se muestra un aviso con acción de actualización. El botón intenta enviar `SKIP_WAITING` al service worker disponible y recarga la página para tomar los assets actualizados.

### Fallback offline

Se agrega una ruta `/offline` y se configura `fallbacks.document` en `next-pwa` para mejorar la respuesta visual cuando una navegación no puede resolverse offline.

## Validación sugerida

```bash
npm run build
git restore public/sw.js public/workbox-*.js 2>/dev/null || true
```

## QA manual

Validar en Android/Chrome desde Vercel:

- Instalar PWA o abrir desde navegador mobile.
- Login como socio.
- Cortar conexión.
- Confirmar aviso “Sin conexión”.
- Restaurar conexión.
- Confirmar aviso “Conexión recuperada”.
- Publicar un nuevo deploy y abrir la app instalada.
- Confirmar aviso de nueva versión cuando el navegador detecte el nuevo service worker.
- Confirmar que admin y usuario interno no reciben avisos molestos en desktop.

## Sin cambios

- No toca base de datos.
- No agrega migraciones.
- No modifica endpoints backend.
