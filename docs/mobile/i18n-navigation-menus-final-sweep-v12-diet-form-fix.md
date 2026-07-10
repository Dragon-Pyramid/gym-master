# i18n navigation menus final sweep v12 - diet form fix

## Objetivo

Corregir textos residuales en inglés/español mezclado dentro del formulario **Diet -> New Diet** cuando el idioma activo es Inglés.

## Ajuste

Se agregan traducciones puntuales al `DashboardInlineI18nSweep` para:

- badge / labels del formulario de dietas;
- placeholders de ejemplo;
- CTA `Generar dieta` / `Generando...` / `Cerrar`;
- variantes mezcladas (`Goal nutricional`, `Date inicio`, `Date fin`);
- opciones de catálogo de objetivos más frecuentes (`Volumen`, `Definición`, `Bajar de peso`, `Aumentar fuerza`, `Mejorar resistencia`, etc.).

## Alcance

- Solo frontend/i18n.
- Sin cambios en DB.
- Sin cambios en endpoints.
- Sin cambios en Swagger/OpenAPI.
- Sin cambios funcionales en la lógica del formulario.

## QA sugerido

Ruta: `/dashboard/dietas`

Validar en Inglés:

- `Nutritional goal`
- `Select goal`
- `Start date`
- `End date`
- `Member request or goal`
- `Restrictions or precautions`
- `Food preferences`
- placeholders de ejemplo en inglés
- `Generate diet`
- `Close`
- opciones del combo traducidas cuando coincidan con los catálogos contemplados.
