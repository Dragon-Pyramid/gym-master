# Evolución Física dark mode cards fix v1

## Objetivo

Corregir problemas visuales en `/dashboard/evolucion-fisica` cuando la app está en modo oscuro.

## Problema

Varias secciones de Evolución Física usaban fondos fijos `bg-white`, `bg-slate-50`, `from-[#f0fbff] to-white` y textos fijos `text-gray-*`.
En dark mode esto dejaba cards blancas con textos claros o de bajo contraste.

## Ajustes

- Reemplazo de fondos fijos por tokens compatibles con el tema:
  - `bg-card`
  - `text-card-foreground`
  - `bg-background`
  - `bg-muted/40`
- Reemplazo de textos fijos por:
  - `text-foreground`
  - `text-muted-foreground`
- Header de Evolución Física con gradiente seguro en dark mode.
- Textareas del RAG Coach ahora respetan dark mode.
- Alertas amber/red agregan variantes dark.
- Hover de tabla evita celeste fuerte en dark mode.

## Pantallas cubiertas

- `/dashboard/evolucion-fisica`
- RAG Coach evolución física
- Dashboard de progreso corporal
- Estudio visual antes/después
- Historial mobile de mediciones

## Alcance

- Solo frontend/dark mode.
- No toca DB.
- No toca endpoints.
- No toca Swagger/OpenAPI.
- No modifica cálculos ni lógica funcional de evolución.
