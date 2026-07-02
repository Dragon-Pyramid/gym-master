# Evolución Física — Fix espacio blanco posterior al footer

## Rama sugerida

`feature/evolucion-fisica-mobile-detail-polish-v1`

## Contexto

Durante la validación con DevTools/F12 se detectó que, al salir del entorno mobile, la pantalla del socio en `/dashboard/evolucion-fisica` podía volver a mostrar una franja blanca debajo del footer.

## Causa

El layout ya utiliza `SidebarInset`, que internamente renderiza un `<main data-slot="sidebar-inset">`. Dentro de la página había otro `<main>` anidado. La regla global de la barra inferior mobile del socio aplica padding a `main:not([data-slot="sidebar-inset"])`, por lo que ese `<main>` interno podía recibir padding mobile residual al alternar entre mobile/desktop en DevTools.

## Solución

Se reemplazó el `<main>` interno de la página por un `<section>` con las mismas clases visuales.

Esto conserva:

- layout visual;
- cards mobile;
- tablas desktop;
- footer;
- animación antes/después;
- mapa corporal;
- coordenadas hombre/mujer;
- overlays musculares.

## Archivos modificados

- `src/app/dashboard/evolucion-fisica/page.tsx`

## Sin cambios en zona crítica

No se tocaron coordenadas, SVG, transforms, overlays, siluetas, músculos ni fondos de la animación.

## Validación sugerida

1. Entrar a `/dashboard/evolucion-fisica`.
2. Probar mobile con F12.
3. Salir de mobile.
4. Confirmar que no queda una página/franja blanca debajo del footer.
5. Confirmar que la animación de hombre/mujer sigue alineada.
6. Ejecutar `npm run build`.
