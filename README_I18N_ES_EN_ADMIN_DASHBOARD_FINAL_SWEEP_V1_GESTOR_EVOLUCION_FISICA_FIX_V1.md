# Patch - i18n ES/EN admin dashboard final sweep v1 - gestor evolución física fix v1

## Objetivo
Corregir textos mezclados ES/EN y mejorar el modo oscuro de las cards de resumen en `/dashboard/gestor-evolucion-fisica`.

## Cambios principales
- Se agregó `useI18n()` y helper `tx(es, en)`.
- Se tradujeron título, descripción, buscador, métricas, cards de socios, estados, empty state y paginación.
- Se adaptaron formatos de fecha/número al idioma activo.
- Se corrigieron las cards de métricas en dark mode para evitar fondo blanco y labels ilegibles.
- Se ajustaron superficies de cards/listado para verse mejor sobre dashboard negro.

## Archivo modificado
- `src/app/dashboard/gestor-evolucion-fisica/page.tsx`

## No incluido
- No toca DB, endpoints, Swagger/OpenAPI ni PDF/exportaciones.
- La pantalla detalle del socio se revisará por separado si aparecen residuos al abrir `View evolution`.
