# i18n ES/EN admin dashboard footer key fix v1

## Objetivo
Corregir el footer global cuando el idioma activo es Inglés y evitar que se renderice la key cruda `footer.developedBy`.

## Ajustes
- `AppFooter` usa `t('footer.developedBy')`.
- Si por cualquier motivo la clave no existe en el diccionario runtime, aplica fallback seguro:
  - ES: `Desarrollado por DRAGONPYRAMID`
  - EN: `Developed by DRAGONPYRAMID`
- Se agrega/asegura la clave `footer.developedBy` en los diccionarios ES/EN cuando el archivo está presente.

## Alcance
No toca DB, endpoints, permisos, rutas ni Swagger/OpenAPI.
