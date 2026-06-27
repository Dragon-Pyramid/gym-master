# Mobile Dashboard Menu Context Hotfix v2

## Objetivo

Corregir la experiencia mobile del dashboard para que el menú lateral pueda abrirse correctamente desde el header en celular, tanto para administrador, usuario interno y socio.

## Problema detectado

El `AppHeader` usaba el estado del `SidebarProvider`, pero el `AppSidebar` mantenía un estado local independiente (`isOpen`). Por eso, al tocar el ícono de lupa/search del header no se abría el menú lateral: el header y el sidebar no estaban hablando con el mismo estado.

Además, el botón flotante del sidebar podía quedar oculto o competir visualmente con el logo/header en mobile.

## Cambios

Archivos modificados:

- `src/components/header/AppHeader.tsx`
- `src/components/sidebar/AppSidebar.tsx`

### AppHeader

- En mobile, el botón que antes mostraba la lupa ahora muestra un ícono de menú.
- Ese botón abre el menú lateral usando `setOpenMobile(true)` desde `useSidebar`.
- En desktop conserva el comportamiento anterior: navegar a `/dashboard`.

### AppSidebar

- Deja de usar estado local propio.
- Usa `openMobile` y `setOpenMobile` del `SidebarProvider`.
- Mantiene el hotfix v1:
  - `fixed`;
  - `h-[100dvh]`;
  - `overflow-y-auto`;
  - `overscroll-contain`;
  - `pb-24`;
  - bloqueo del scroll del body mientras el menú está abierto.
- Se elimina el botón hamburguesa flotante para evitar conflicto con el logo/header.

## Validación sugerida

1. Probar en DevTools mobile o celular real.
2. Entrar como admin, usuario interno y socio.
3. Ir a `/dashboard`.
4. Tocar el ícono de menú del header.
5. Confirmar que el menú lateral se abre desde la izquierda.
6. Confirmar que el menú permite scroll hasta el final.
7. Tocar una opción inferior y confirmar que navega y cierra el menú.
8. En desktop, confirmar que el botón mantiene comportamiento de acceso al dashboard.
