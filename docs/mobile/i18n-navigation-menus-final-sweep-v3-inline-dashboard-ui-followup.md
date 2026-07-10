# i18n navigation menus final sweep v3 - dashboard follow-up

## Objetivo
Corregir remanentes detectados en QA luego del v2.

## Ajustes

### 1. Actividades
- Se elimina el fondo blanco del selector/listado de socios dentro de inscripción.
- Se mejora el contraste en modo oscuro.
- Se traducen labels faltantes del bloque de inscripción y el catálogo.

### 2. Rutine assistant
- Se agregan traducciones ES → EN para el contenido visible de la pantalla `/dashboard/rutinas/asistente`.
- Cubre hero, ayuda, formulario, resumen interpretado y resultado.

### 3. Members 360
- Se agregan variantes faltantes como `Con emergencia`, `Riesgo alto`, `Con alertas` y otros remanentes de cards/resúmenes.

### 4. Paginación / contadores
- Se agrega traducción de `actividades` y `socios` dentro de `commercialUi` para frases dinámicas como `Showing 1 - 8 of 16 activities`.
- Se agrega traducción base `Ver -> View` para acciones todavía visibles en inglés mixto.

## Alcance técnico
- Frontend/i18n only.
- No DB.
- No endpoints.
- No Swagger/OpenAPI.
- Sin cambios de permisos ni lógica de negocio.
