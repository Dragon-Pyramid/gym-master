# PWA Android Installed App Polish v1

## Rama

`feature/pwa-android-installed-app-polish-v1`

## Objetivo

Pulir la experiencia de Gym Master cuando se abre desde el ícono instalado en Android como PWA standalone, manteniendo compatibilidad con navegador web, mobile browser, admin y usuario interno.

## Alcance

- Controlador invisible para detectar modo standalone.
- Clases globales `gm-pwa-standalone`, `gm-pwa-android` y `gm-pwa-ios`.
- Variable CSS `--gm-vh` basada en `window.innerHeight` para evitar saltos visuales en Android.
- Ajustes de safe-area para bottom navigation y banners flotantes.
- Prompt de instalación reforzado para ocultarse si la app ya está instalada.
- Banner offline/update más estable al recuperar conexión.
- Manifest con splash/background oscuro coherente con `theme_color`.
- Metadata mobile web app compatible con Android/iOS.
- Página `/offline` ajustada a viewport real.

## Archivos modificados

- `src/components/header/AppHeader.tsx`
- `src/components/pwa/PwaAndroidInstalledAppPolish.tsx`
- `src/components/pwa/SocioPwaInstallPrompt.tsx`
- `src/components/pwa/PwaConnectionUpdateBanner.tsx`
- `src/components/navigation/SocioMobileBottomNavigation.tsx`
- `src/app/layout.tsx`
- `src/app/globals.css`
- `src/app/offline/page.tsx`
- `public/manifest.json`

## Validación sugerida

```bash
npm run build
git restore public/sw.js public/workbox-*.js public/fallback-*.js 2>/dev/null || true
rm -f public/fallback-*.js
```

## QA Android real

1. Abrir Gym Master desde Chrome Android.
2. Instalar la app o abrirla desde el ícono instalado.
3. Confirmar que el prompt de instalación no aparece en standalone.
4. Confirmar que la bottom navigation no tapa contenido.
5. Confirmar que offline/update no se superpone mal.
6. Rotar pantalla y volver a portrait.
7. Enviar app a segundo plano y volver.
8. Confirmar que no hay flashes blancos notorios ni saltos de altura.
9. Confirmar que admin y usuario interno no ven elementos específicos de socio.

## Notas

No incluye cambios en backend, base de datos ni autenticación.
