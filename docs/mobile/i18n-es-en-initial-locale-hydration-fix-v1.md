# i18n ES/EN · Initial locale hydration fix v1

## Objetivo

Evitar que los estados iniciales de carga muestren textos en Español cuando el usuario ya eligió Inglés.

## Problema detectado

Durante la carga temprana del dashboard podían aparecer textos como `Cargando dashboard...` o `Validando acceso...` aunque el usuario hubiera seleccionado Inglés.

El motivo era que el proveedor i18n iniciaba siempre con `DEFAULT_LOCALE` y recién después del primer render resolvía `localStorage`/navegador.

## Corrección

- El `I18nProvider` resuelve el idioma inicial de forma síncrona en el inicializador de `useState`.
- La preferencia manual guardada en `gym-master-locale-v1` tiene prioridad inmediata.
- Si no hay preferencia manual, se usa la detección del navegador.
- Se mantiene fallback seguro.
- Se agrega `suppressHydrationWarning` en el nodo `<html>` para evitar warnings esperables entre idioma server/client.

## Archivos

- `src/i18n/I18nProvider.tsx`
- `src/app/layout.tsx`

## Impacto

No toca DB, endpoints ni Swagger/OpenAPI.
