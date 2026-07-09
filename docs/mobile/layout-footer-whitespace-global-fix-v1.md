# Layout/footer whitespace global fix v1

## Objetivo

Corregir de forma global el espacio vacío que podía aparecer después del footer del dashboard, especialmente luego de pruebas responsive/mobile y con la barra inferior del socio activa.

## Problema

La app tiene muchas páginas de dashboard con shells similares pero no idénticos:

- páginas con `SidebarInset`;
- páginas con wrappers propios `min-h-screen`;
- páginas fullscreen como el dashboard principal;
- páginas socio con bottom navigation móvil.

El padding necesario para que la bottom navigation del socio no tape el contenido podía aplicarse de forma demasiado amplia sobre cualquier `main`. En algunos recorridos eso podía empujar el layout externo y dejar una franja vacía después de `Desarrollado por DRAGONPYRAMID`.

## Ajustes

- Se agrega una clase estable al shell de sidebar: `gm-dashboard-shell`.
- Se agrega una clase estable al inset principal: `gm-dashboard-inset`.
- Se agrega una clase estable al footer: `gm-dashboard-footer`.
- Se agrega una clase auxiliar para shells legacy sin `SidebarInset`: `gm-dashboard-scroll-root`.
- Se asegura fondo global en `html` y `body`.
- Se cambia la regla mobile de `body.gm-socio-bottom-nav main:not(...)` por selectores específicos:
  - solo contenido real del dashboard recibe padding inferior;
  - el shell, el inset y el footer quedan sin padding/margen extra.
- Se marcan como contenido las páginas legacy sin `SidebarInset`:
  - `/dashboard`
  - `/dashboard/admin`
  - `/dashboard/ayuda`
  - `/dashboard/control-asistencia`

## Alcance

- Solo frontend/layout/CSS.
- No toca DB.
- No toca endpoints.
- No toca Swagger/OpenAPI.
- No modifica reglas de negocio.
