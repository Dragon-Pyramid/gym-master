# Patch - i18n ES/EN admin dashboard final sweep v1 - gestor dietas fix v1

## Objetivo
Corregir textos ES/EN mezclados en el gestor de dietas y en el detalle de dieta visible desde admin.

## Alcance
- `/dashboard/gestor-dietas`
- `/dashboard/gestor-dietas/dieta/[idDieta]`
- Modal de creación de dieta desde tarjeta de socio
- Display de dieta y seguimiento de comidas

## Cambios principales
- Se incorporó `useI18n()` en las pantallas/componentes del flujo.
- Se tradujeron títulos, labels, botones, placeholders, mensajes vacíos, métricas y seguimiento.
- Se agregó helper de presentación para traducir nombres de dietas/objetivos/comidas/alimentos semilla desde datos existentes sin modificar DB.
- Se pasa el idioma activo al generador de dieta (`idioma: locale`) para reducir futuras generaciones en idioma incorrecto.

## Archivos modificados/agregados
- `src/app/dashboard/gestor-dietas/page.tsx`
- `src/app/dashboard/gestor-dietas/dieta/[idDieta]/page.tsx`
- `src/components/gestor-dietas/SocioDietaCard.tsx`
- `src/components/gestor-dietas/SocioDietaGrid.tsx`
- `src/components/forms/DietaForm.tsx`
- `src/components/dashboard/dietas/DietaDisplay.tsx`
- `src/utils/dietaI18nPresentation.ts`

## No incluido
- No toca DB, endpoints ni Swagger/OpenAPI.
- No modifica PDF exportado; los artefactos PDF/Excel siguen pendientes para la feature futura de exportaciones i18n.
