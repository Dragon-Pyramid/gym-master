# i18n navigation menus final sweep v9 - Coach confidence label fix

## Objetivo

Corregir el remanente `Confianza: Pendiente` visible en `/dashboard/coach` cuando el idioma activo es Inglés.

## Ajuste

Se agregan traducciones puntuales al `DashboardInlineI18nSweep`:

- `Confianza:` → `Confidence:`
- `Confianza` → `Confidence`
- `Pendiente` → `Pending`

## Motivo

El texto visible podía renderizarse como partes separadas y no siempre coincidía con la frase completa ya existente.

## Alcance

- Solo frontend/i18n.
- No toca DB.
- No toca endpoints.
- No toca Swagger/OpenAPI.
- No modifica lógica funcional del Coach IA.
