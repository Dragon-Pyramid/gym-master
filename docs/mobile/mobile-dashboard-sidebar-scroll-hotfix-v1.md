# Mobile Dashboard Sidebar Scroll Hotfix v1

## Objetivo

Corregir la experiencia mobile del dashboard cuando el usuario abre el menú desde el botón hamburguesa/lupa y el listado completo de opciones no puede visualizarse o desplazarse correctamente en celular.

## Causa

El sidebar mobile usaba `absolute` y `h-max`, por lo que cuando el menú era más alto que el viewport del teléfono, el contenido podía quedar cortado o competir con el scroll de la página. Además, el `z-index` estaba al mismo nivel que el header sticky.

## Cambios

Archivo modificado:

- `src/components/sidebar/AppSidebar.tsx`

Ajustes aplicados:

- Sidebar mobile pasa de `absolute` a `fixed`.
- Altura mobile ajustada a `h-[100dvh] max-h-[100dvh]`.
- Se agrega `overflow-y-auto`, `overscroll-contain` y `pb-24`.
- Se eleva el `z-index` del sidebar, overlay y botón hamburguesa.
- El botón cerrar queda sticky arriba dentro del menú.
- Se bloquea el scroll del body mientras el menú mobile está abierto.

## Validación sugerida

1. Abrir el dashboard desde celular o DevTools mobile.
2. Ir a `/dashboard`.
3. Tocar el botón hamburguesa.
4. Verificar que se puede scrollear hasta el final del menú.
5. Entrar a una opción inferior del menú y confirmar que el sidebar se cierra.
6. Confirmar que en desktop el sidebar no cambia.
