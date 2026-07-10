# i18n navigation menus final sweep v13 - medical record labels fix

## Objetivo

Corregir remanentes puntuales de ES/EN en `/dashboard/ficha-medica` cuando el idioma activo es Inglés.

## Ajuste

Se agregan traducciones puntuales al `DashboardInlineI18nSweep`:

- `Review médica operativa` → `Operational medical review`
- `REVIEW MÉDICA OPERATIVA` → `OPERATIONAL MEDICAL REVIEW`
- `Vista de revisión admin` → `Admin review view`
- `Panel de revisión admin` → `Admin review panel`
- `APTO MÉDICO` → `MEDICAL CLEARANCE`
- `Apto médico` → `Medical clearance`
- `Documentos` → `Documents`
- `Archivos adjuntos` → `Attachments`

## Alcance

- Solo frontend/i18n.
- Sin cambios en DB.
- Sin cambios en endpoints.
- Sin cambios en Swagger/OpenAPI.
- Sin cambios funcionales en ficha médica.
