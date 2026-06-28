# Socio Mobile PWA Install Experience v1

## Rama

`feature/pwa-mobile-install-experience-v1`

## Objetivo

Cerrar la experiencia mobile tipo app de Gym Master agregando una base PWA más sólida para instalación desde celular, especialmente para el rol socio.

## Alcance funcional

- Se mejora el `manifest.json` con metadatos completos de PWA.
- Se agregan iconos reales de instalación en tamaños requeridos.
- Se define `start_url` hacia `/dashboard` para que la app instalada abra directamente el panel.
- Se agregan shortcuts PWA para Inicio, Rutina, Dieta y Pagos.
- Se incorpora prompt discreto de instalación para socio mobile.
- Se evita mostrar el prompt si la app ya corre en modo standalone.
- Se evita mostrar el prompt en admin y usuario interno.
- Se respeta iOS con mensaje manual de instalación cuando no existe `beforeinstallprompt`.

## Archivos modificados

- `public/manifest.json`
- `public/icon-192x192.png`
- `public/icon-512x512.png`
- `public/maskable-icon-192x192.png`
- `public/maskable-icon-512x512.png`
- `public/apple-touch-icon.png`
- `src/app/layout.tsx`
- `src/app/globals.css`
- `src/components/header/AppHeader.tsx`
- `src/components/pwa/SocioPwaInstallPrompt.tsx`

## Decisiones técnicas

### Manifest

El manifest anterior referenciaba iconos que no estaban presentes en `public`. Esta feature agrega los PNG requeridos y mejora la metadata de instalación:

- `name`
- `short_name`
- `description`
- `id`
- `start_url`
- `scope`
- `theme_color`
- `background_color`
- `icons`
- `shortcuts`

### Prompt de instalación

El prompt se implementa como componente cliente porque depende de APIs del navegador:

- `beforeinstallprompt`
- `appinstalled`
- `matchMedia('(display-mode: standalone)')`
- detección iOS standalone
- `localStorage` para no mostrarlo repetidamente

### Alcance por rol

El componente usa `useAuthStore` y `useIsMobile` para limitar la experiencia a:

- usuario autenticado
- rol `socio`
- viewport mobile
- app no instalada / no standalone

## Validación sugerida

```bash
npm run build
git restore public/sw.js public/workbox-*.js 2>/dev/null || true
```

## QA manual

### Socio mobile

- Abrir `/dashboard` desde navegador mobile.
- Confirmar que la home app-like y bottom navigation siguen funcionando.
- Confirmar que aparece el prompt de instalación cuando el navegador lo permite.
- Confirmar que el prompt queda por encima de la bottom navigation sin taparla.
- Confirmar que se puede cerrar con “Después”.
- Confirmar que no reaparece inmediatamente al cerrarlo.

### Modo instalado

- Instalar la app desde Chrome/Android o desde Safari iOS con “Agregar a inicio”.
- Abrir desde el icono.
- Confirmar que abre en `/dashboard`.
- Confirmar que no se muestra el prompt de instalación.

### Admin / usuario interno

- Iniciar sesión como admin.
- Confirmar que no aparece prompt PWA intrusivo.
- Iniciar sesión como usuario interno.
- Confirmar que no aparece prompt PWA intrusivo.

## Riesgo

Bajo. La feature no modifica backend, base de datos, permisos ni flujos críticos. El principal riesgo era mostrar prompts intrusivos a otros roles; queda controlado por rol y viewport.

## Rollback

Revertir esta rama elimina el prompt y vuelve al manifest anterior. No requiere rollback de DB.
