# i18n ES/EN foundation v1

## Rama

`feature/i18n-es-en-foundation-v1`

## Objetivo

Dejar una base de internacionalización ES/EN para Gym Master sin traducir todo el sistema en esta rama. La feature prepara la arquitectura, el selector de idioma, los diccionarios iniciales y una estrategia de traducción progresiva por módulos.

## Alcance implementado

- Se agregó una capa propia de i18n sin incorporar dependencias nuevas.
- Se definieron idiomas soportados: Español (`es`) e Inglés (`en`).
- Se creó fallback seguro a Español cuando una clave no existe en el idioma activo.
- Se agregó persistencia local de idioma por dispositivo.
- Se actualiza `document.documentElement.lang` y `data-locale` desde el provider cliente.
- Se agregó `I18nProvider` dentro de `SessionWrapper`.
- Se creó `LanguageSwitcher` reutilizable para header y preferencias.
- Se incorporó selector compacto de idioma en `AppHeader`.
- Se incorporó bloque de idioma en `/dashboard/settings/preferences`.
- Se tradujeron textos base del header y de preferencias como prueba de integración real.

## Archivos modificados

- `src/components/SessionWrapper.tsx`
- `src/components/header/AppHeader.tsx`
- `src/app/dashboard/settings/preferences/page.tsx`

## Archivos nuevos

- `src/i18n/config.ts`
- `src/i18n/dictionaries.ts`
- `src/i18n/translator.ts`
- `src/i18n/I18nProvider.tsx`
- `src/components/i18n/LanguageSwitcher.tsx`
- `docs/mobile/i18n-es-en-foundation-v1.md`

## Decisión técnica

No se agregó `next-i18next`, `next-intl` ni otra dependencia externa en esta etapa. La base se resolvió con un provider liviano porque el objetivo de esta rama es preparar la traducción progresiva sin reestructurar rutas, layouts ni navegación.

## Estrategia futura

Las próximas ramas pueden ampliar diccionarios por módulo:

- `common`
- `auth`
- `dashboard`
- `socio`
- `admin`
- `commercial`
- `rag`
- `reports`
- `errors`

## Validación esperada

- `npm run build` debe pasar correctamente.
- El header debe mostrar el selector compacto `ES/EN`.
- El cambio de idioma debe persistir al recargar.
- `/dashboard/settings/preferences` debe mostrar el bloque de idioma.
- `document.documentElement.lang` debe cambiar entre `es` y `en`.
- No debe haber scroll horizontal ni espacio blanco posterior al footer.
- No se modifica DB.
- No se modifican endpoints.
- No se modifica Swagger/OpenAPI.
