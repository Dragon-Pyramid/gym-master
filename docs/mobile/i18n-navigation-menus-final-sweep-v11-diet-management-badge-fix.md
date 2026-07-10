# i18n navigation menus final sweep v11 - diet management badge fix

## Objetivo

Corregir el badge `Gestión de dietas` visible en `/dashboard/dietas` cuando el idioma activo es Inglés.

## Ajuste

Se agregan variantes puntuales al `DashboardInlineI18nSweep`:

- `Gestión de dietas` → `Diet management`
- `gestión de dietas` → `diet management`
- `GESTION DE DIETAS` → `DIET MANAGEMENT`

## Motivo

La pantalla puede renderizar el texto como title case y luego aplicar mayúsculas por CSS, por lo que no siempre coincidía con la clave uppercase previa.

## Alcance

- Solo frontend/i18n.
- No toca DB.
- No toca endpoints.
- No toca Swagger/OpenAPI.
- No modifica lógica funcional de Dietas.
