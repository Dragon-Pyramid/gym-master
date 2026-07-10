# i18n navigation menus final sweep v2 - inline dashboard UI

## Objetivo

Cubrir textos heredados visibles en Español dentro del dashboard cuando el idioma activo es Inglés.

## Contexto

Luego del primer barrido de navegación, todavía quedaban literals internos en pantallas y modales:

- `/dashboard/coach`
- `/dashboard/dietas`
- `/dashboard/ficha-medica`
- `/dashboard/socios`
- `/dashboard/actividades`
- modal Socio 360
- modal Editar Socio
- tablas y formularios de Actividades

## Ajuste

Se agrega `DashboardInlineI18nSweep`, un componente cliente montado en `src/app/dashboard/layout.tsx`.

El componente:

- actúa solo dentro del dashboard;
- se activa cuando el locale es `en`;
- traduce textos heredados conocidos mediante un diccionario ES → EN;
- observa contenido dinámico con `MutationObserver`, por lo que también cubre modales;
- traduce text nodes y atributos `placeholder`, `title` y `aria-label`;
- conserva valores originales para poder volver a ES si el usuario cambia idioma;
- evita `script`, `style`, `svg`, `canvas` y nodos marcados con `data-i18n-sweep="off"`.

## Alcance de traducciones agregadas

- Coach IA contextual.
- Gestión de dietas.
- Ficha médica admin/socio.
- Socios 360 y modales asociados.
- Actividades, turnos, cupos, inscripciones y catálogo.
- Etiquetas de tabla, botones, placeholders y mensajes auxiliares.

## Alcance técnico

- Solo frontend/i18n.
- No toca DB.
- No toca endpoints.
- No toca Swagger/OpenAPI.
- No modifica rutas ni permisos.
- No modifica lógica funcional.
