# Evolución Física footer whitespace fix v2

## Objetivo

Corregir el espacio vacío que quedaba después del footer en `/dashboard/evolucion-fisica`.

## Contexto

El fix global de footer corrigió el comportamiento general del dashboard y el fix de dark mode corrigió las cards blancas de Evolución Física. Sin embargo, esta pantalla todavía podía dejar aire visual al final, después de `Developed by DRAGONPYRAMID`.

## Ajustes

- Se agrega una marca específica de página:
  - `gm-dashboard-page-evolucion-fisica`
- Se marca el contenido real:
  - `data-gm-dashboard-content="true"`
  - `gm-evolucion-fisica-content`
- Se ajusta el `SidebarInset` de la pantalla:
  - `gm-evolucion-fisica-inset`
- Se permite que `AppFooter` reciba `className` opcional.
- En esta pantalla se usa:
  - `gm-evolucion-fisica-footer mt-0`
- Se agrega guard CSS específico para eliminar margen/padding final no deseado sin afectar otros módulos.

## Alcance

- Solo frontend/layout.
- No toca DB.
- No toca endpoints.
- No toca Swagger/OpenAPI.
- No modifica cálculos ni lógica funcional de Evolución Física.
