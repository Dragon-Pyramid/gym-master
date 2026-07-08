# i18n ES/EN login browser detection v1

## Objetivo

Extender la foundation i18n para que el idioma también pueda cambiarse desde el login y para que la primera carga detecte automáticamente el idioma inicial según la configuración del navegador.

## Alcance

- Selector ES/EN visible en `/auth/login`.
- Selector ES/EN visible en los formularios de login de socio, administración y Master Admin.
- Traducción inicial de textos principales de login.
- Detección automática inicial:
  - Español cuando el navegador reporta idioma o región hispana.
  - Inglés para el resto de idiomas/regiones.
- La preferencia manual del usuario prevalece sobre la detección automática y queda guardada en `localStorage`.
- Se mantiene `document.documentElement.lang` sincronizado con el idioma activo.

## Decisión técnica

No se usa geolocalización ni IP. La detección se basa en señales disponibles del navegador:

- `navigator.languages`
- `navigator.language`
- `Intl.DateTimeFormat().resolvedOptions().locale`

Esto evita pedir permisos, reduce fricción y respeta privacidad.

## Archivos modificados

- `src/i18n/config.ts`
- `src/i18n/I18nProvider.tsx`
- `src/i18n/dictionaries.ts`
- `src/components/auth/GymMasterLoginForm.tsx`
- `src/app/auth/login/page.tsx`
- `src/app/auth/login/admin/page.tsx`
- `src/app/auth/login/socio/page.tsx`
- `src/app/auth/login/masteradmin/page.tsx`

## QA sugerido

1. Entrar a `/auth/login`.
2. Confirmar selector de idioma visible.
3. Cambiar ES/EN y confirmar traducción de cards.
4. Entrar a `/auth/login/socio`.
5. Confirmar selector visible y textos traducidos.
6. Repetir en `/auth/login/admin` y `/auth/login/masteradmin`.
7. Confirmar que recargar conserva el idioma elegido.
8. Confirmar que `document.documentElement.lang` cambia entre `es` y `en`.
9. Probar con `localStorage.removeItem('gym-master-locale-v1')` y recargar para validar detección automática.
10. Probar F12 mobile/desktop, modo claro/oscuro y ausencia de scroll horizontal.
