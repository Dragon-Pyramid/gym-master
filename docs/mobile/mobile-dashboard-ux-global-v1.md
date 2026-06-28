# Mobile Dashboard UX Global v1

## Objetivo

Mejorar la experiencia mobile global del dashboard de Gym Master para los tres perfiles principales:

- Administrador
- Usuario interno
- Socio

Esta feature continúa el hotfix del menú mobile y aplica una primera base de pulido visual/responsivo en el dashboard principal.

## Problemas abordados

- Header mobile con demasiado espacio y riesgo de wrap visual.
- Botones del panel ejecutivo poco cómodos en mobile.
- Riesgo de overflow lateral por clases `col-span-12` dentro de grids que no tienen 12 columnas.
- Cards y gráficos con alturas poco amigables en pantallas pequeñas.
- Menú mobile con área táctil mejorable.
- Scroll lateral accidental en el documento.

## Archivos modificados

- `src/components/header/AppHeader.tsx`
- `src/components/sidebar/AppSidebar.tsx`
- `src/components/sidebar/SidebarSection.tsx`
- `src/app/dashboard/page.tsx`
- `src/components/dashboard/cuotas/CuotasEstadoDashboard.tsx`
- `src/app/globals.css`

## Cambios principales

### Header mobile

- Se evita el wrap del header.
- Se compacta logo y título en mobile.
- Se reduce el gap entre acciones.
- Se mantiene el comportamiento del botón de menú mobile agregado en el hotfix anterior.

### Sidebar mobile

- Se agrega semántica accesible `dialog` cuando está en mobile.
- Se mejora el overlay con un blur sutil.
- Se considera `env(safe-area-inset-bottom)` para celulares con área segura.
- El cierre queda sticky arriba con fondo del sidebar.

### SidebarSection

- Cada ítem del menú pasa a ser un link de fila completa usando `asChild`.
- Se mejora el área táctil con `min-h-10` y `touch-manipulation`.
- Se evita que solo el texto sea clickeable.

### Dashboard principal

- Se agrega `min-w-0` y `overflow-x-hidden` en contenedores críticos.
- Se optimiza padding mobile del `main`.
- El panel ejecutivo tiene mejor lectura mobile.
- Los botones rápidos son full width en mobile y vuelven a tamaño natural en pantallas mayores.
- Se corrigen cards con `col-span-12` que podían crear columnas implícitas y overflow.

### Estado de cuotas

- Se eliminan `col-span-12` en un grid que no usa 12 columnas.
- Se ajusta la sección para ocupar columnas reales según breakpoint.
- El botón actualizar se vuelve full width en mobile.

### CSS global

- Se evita scroll horizontal accidental en `html` y `body`.
- Se agregan utilidades de soporte para scroll mobile y safe-area.

## Validación sugerida

1. Ejecutar `npm run build`.
2. Probar `/dashboard` en DevTools con iPhone 12 Pro.
3. Validar login como admin, usuario interno y socio.
4. Confirmar que el header no se rompe en mobile.
5. Confirmar que el menú abre, cierra y scrollea correctamente.
6. Confirmar que no aparece scroll horizontal.
7. Confirmar que las cards de cuotas y gráficos no desbordan.
8. Confirmar que desktop mantiene layout correcto.
