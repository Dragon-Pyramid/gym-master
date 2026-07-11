# Patch - i18n ES/EN admin dashboard final sweep v1 - header notifications bell fix v1

## Objetivo
Corregir textos en español o mezclados ES/EN dentro del dropdown de la campanita de notificaciones del header cuando el idioma activo está en Inglés.

## Cambios principales
- Se incorporó `useI18n()` en `HeaderNotificationsBell`.
- Se tradujeron labels fijos: Notificaciones, estado vacío, Actualizar, Ver centro completo y aria-label.
- Se tradujeron severidades: alta/media/baja -> high/medium/low.
- Se agregó traducción de presentación para títulos y resúmenes dinámicos devueltos por `/api/notificaciones/header` sin tocar DB ni backend.
- Se cubren notificaciones de cuotas, stock, mensajes, mantenimiento/equipamiento, ficha médica, perfil y acceso.

## Archivo modificado
- `src/components/header/HeaderNotificationsBell.tsx`

## Alcance
Solo UI/header. No toca DB, endpoints, Swagger ni servicios.
