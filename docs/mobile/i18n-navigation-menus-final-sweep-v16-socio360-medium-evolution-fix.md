# i18n navigation menus final sweep v16 - Socio 360 medium/evolution fix

## Objetivo

Corregir dos remanentes puntuales en el modal 360 de `/dashboard/socios` cuando el idioma activo es Inglés.

## Ajuste

- `medio` → `Medium`
- `Evolution demo mensual para BI y recorrido del socio.` → `Monthly evolution demo for BI and member journey.`

## Nota técnica

`medio` se maneja como traducción exacta solamente para evitar reemplazos peligrosos dentro de palabras como `intermedio`.

## Alcance

- Solo frontend/i18n.
- Sin cambios en DB.
- Sin cambios en endpoints.
- Sin cambios en Swagger/OpenAPI.
- Sin cambios funcionales en Members / Socio 360.
