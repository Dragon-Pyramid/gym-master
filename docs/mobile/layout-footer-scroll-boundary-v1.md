# fix/layout-footer-scroll-boundary-v1

## Objetivo

Corregir el scroll vertical sobrante que permitía seguir bajando después del footer `Desarrollado por DRAGONPYRAMID`, generando una franja blanca visible especialmente en inspección mobile con F12 y también detectable en vistas web con contenido corto.

## Diagnóstico

Se detectaron dos causas probables en el layout del dashboard:

1. El `main` global usado para compensar la bottom navigation del socio aplicaba padding a todos los `<main>`, incluyendo `SidebarInset`, que es el shell que envuelve header, contenido y footer. Ese padding quedaba después del footer.
2. El sidebar desktop podía aportar altura al contenedor principal cuando el menú era más largo que el contenido real de la página. Esto estiraba el layout completo en vez de permitir que el menú scrollee de forma independiente.

## Cambios realizados

### Footer

- `AppFooter` ahora usa `mt-auto` y `shrink-0`.
- El footer queda como cierre real del shell flex.
- Se eliminó el margen superior como factor de crecimiento artificial.

### Sidebar desktop

- En desktop, el sidebar queda `sticky top-0`.
- La altura queda limitada a `h-[100dvh]` / `max-h-[100dvh]`.
- Si el menú es largo, scrollea internamente con `overflow-y-auto`.
- El menú lateral ya no fuerza altura extra sobre el contenido central.

### SidebarInset / shell

- `SidebarProvider` y `SidebarInset` pasan a usar `min-h-[100dvh]`.
- Se agrega `overflow-x-hidden` y `min-w-0` donde corresponde.
- El shell queda preparado para que el footer cierre la pantalla sin sábana blanca inferior.

### Bottom navigation del socio

- El padding inferior de la bottom nav se limita a los `<main>` de contenido.
- Se excluye explícitamente `main[data-slot="sidebar-inset"]`.
- Esto evita que el espacio de seguridad de la bottom nav aparezca debajo del footer.

### Dashboard principal

- La pantalla `/dashboard` no usa `SidebarInset`, por lo que se ajustó su wrapper manual:
  - `min-h-[100dvh]`
  - `items-stretch`
  - `overflow-x-hidden`
  - columna central con `min-h-[100dvh]`

## Archivos modificados

- `src/app/dashboard/page.tsx`
- `src/app/globals.css`
- `src/components/footer/AppFooter.tsx`
- `src/components/sidebar/AppSidebar.tsx`
- `src/components/ui/sidebar.tsx`

## Validación sugerida

1. Ejecutar build:
   ```bash
   npm run build
   git restore public/sw.js public/workbox-*.js 2>/dev/null || true
   ```

2. Validar como socio en mobile:
   - `/dashboard`
   - `/dashboard/perfil`
   - `/dashboard/mi-cuenta/pagar-cuota`
   - `/dashboard/rutinas/asistente`
   - `/dashboard/dietas`

3. Validar como admin/usuario interno:
   - `/dashboard`
   - `/dashboard/actividades`
   - `/dashboard/cuotas`
   - `/dashboard/socios`
   - `/dashboard/productos`

4. En cada pantalla:
   - Bajar hasta el footer.
   - Confirmar que no queda una sábana blanca interminable debajo.
   - Confirmar que el sidebar desktop scrollea internamente si el menú excede la altura.
   - Confirmar que la bottom navigation del socio no tapa contenido.

## Impacto

- Cambio únicamente de layout/CSS.
- No toca backend.
- No toca base de datos.
- No modifica permisos ni rutas.
- Mejora UX global del dashboard.
