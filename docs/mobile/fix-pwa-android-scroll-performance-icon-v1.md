# fix/pwa-android-scroll-performance-icon-v1

## Objetivo

Corregir la demora de scroll detectada en Android al usar Gym Master como PWA instalada y mejorar la visibilidad del icono en el launcher.

## Cambios principales

- Se eliminó la actualización dinámica de `--gm-vh` durante eventos de `resize`, `orientationchange`, `pageshow` y `visibilitychange`.
- Se retiraron reglas globales que podían interferir con el gesto nativo de scroll en Android: `touch-action`, `overscroll-behavior-y` y `min-height` calculado por viewport variable.
- Se alivianó el render de elementos fijos mobile quitando `backdrop-blur` en bottom navigation y banner PWA.
- Se cambió `/offline` para usar `min-h-screen` y evitar depender de la variable dinámica de viewport.
- Se actualizó el icono PWA a fondo negro con logo Gym Master blanco para mejorar contraste en Android.
- Se ajustaron `background_color`, `theme_color` y `themeColor` a negro para reducir flashes claros y alinear splash/icono.

## Archivos modificados

- `src/components/pwa/PwaAndroidInstalledAppPolish.tsx`
- `src/components/pwa/PwaConnectionUpdateBanner.tsx`
- `src/components/navigation/SocioMobileBottomNavigation.tsx`
- `src/app/globals.css`
- `src/app/layout.tsx`
- `src/app/offline/page.tsx`
- `public/manifest.json`
- `public/icon-192x192.png`
- `public/icon-512x512.png`
- `public/maskable-icon-192x192.png`
- `public/maskable-icon-512x512.png`
- `public/apple-touch-icon.png`

## QA sugerido

1. Abrir desde Android como app instalada.
2. Entrar como socio al dashboard.
3. Scrollear lentamente y luego rápido con el dedo.
4. Validar que no haya trabas ni retraso de respuesta.
5. Cortar internet y verificar que el banner offline no genere tirones.
6. Reinstalar la PWA si el icono viejo queda cacheado por Android.
