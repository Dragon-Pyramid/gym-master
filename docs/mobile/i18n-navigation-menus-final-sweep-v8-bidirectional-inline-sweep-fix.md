# i18n navigation menus final sweep v8 - bidirectional inline sweep fix

## Objetivo

Corregir el problema donde el dashboard quedaba pegado en Inglés al intentar volver a Español.

## Problema

`DashboardInlineI18nSweep` traducía textos heredados ES → EN mutando nodos del DOM. Al cambiar el idioma de vuelta a ES, algunos textos quedaban en Inglés porque el sweep no hacía la conversión inversa de forma confiable.

## Ajuste

- Se agrega diccionario inverso automático EN → ES.
- El sweep ahora traduce de forma bidireccional:
  - `locale === 'en'`: ES → EN.
  - `locale !== 'en'`: EN → ES.
- La traducción trabaja sobre el valor actual del nodo/atributo.
- Se mantiene el comportamiento para contenido dinámico y modales.
- Se conserva la exclusión de `script`, `style`, `svg`, `canvas` y `data-i18n-sweep="off"`.

## Alcance

- Solo frontend/i18n.
- No toca DB.
- No toca endpoints.
- No toca Swagger/OpenAPI.
- No cambia rutas ni permisos.
