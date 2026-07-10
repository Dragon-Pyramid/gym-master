# i18n navigation menus final sweep v20 - Activities select light-mode fix

## Objetivo

Corregir dos hallazgos puntuales en `/dashboard/actividades` durante QA en modo claro e idioma Inglés.

## Ajustes

### 1. Contraste de selects/combos en modo claro

Se corrigen los controles que quedaban con fondo oscuro en modo claro:

- Activity
- Day
- Status
- Instructor
- Location
- Shift
- Member search list
- Quick selector

El cambio mantiene el estilo oscuro para dark mode mediante clases `dark:*`.

### 2. Textos puntuales del modal New Activity

Se agregan traducciones exactas en `DashboardInlineI18nSweep` para evitar mezclas como:

- `Name de Activity` → `Activity name`
- `Crear Activity` → `Create activity`
- `Cancelar` → `Cancel`
- `Ingrese nombre de la actividad` → `Enter activity name`

## Alcance

- Solo frontend.
- Sin cambios en DB.
- Sin cambios en endpoints.
- Sin cambios en Swagger/OpenAPI.
- Sin cambios en lógica de turnos, inscripciones o actividades.
- Sin cambios de estructura visual fuera de los controles afectados.

## QA sugerido

Ruta: `/dashboard/actividades`

Validar en modo claro + EN:

1. Combos de Crear/editar turno:
   - Activity
   - Day
   - Status
   - Instructor
   - Location

2. Bloque Enroll member:
   - Shift
   - Member search list
   - Quick selector

3. Modal New Activity:
   - `Activity name`
   - `Enter activity name`
   - `Create activity`
   - `Cancel`
