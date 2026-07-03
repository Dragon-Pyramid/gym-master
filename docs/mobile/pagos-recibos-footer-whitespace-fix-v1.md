# Gym Master — Pagos y recibos footer whitespace fix v1

## Rama

`feature/pagos-recibos-mobile-final-polish-v1`

## Alcance

Corrección puntual del espacio en blanco que podía quedar después del footer al salir del modo responsive/F12 en las pantallas de pagos y recibos del socio.

## Archivos modificados

- `src/app/dashboard/mi-cuenta/pagar-cuota/page.tsx`
- `src/app/dashboard/mi-cuenta/historial-pagos/page.tsx`

## Cambios técnicos

- El contenedor principal pasa de `min-h-screen` a `h-[100dvh] min-h-0 overflow-hidden`.
- `SidebarInset` queda con altura fija de viewport dinámico mediante `!h-[100dvh] !min-h-0`.
- El contenido central queda como área scrollable interna con `overflow-y-auto` y `overscroll-contain`.
- Se reemplaza el `<main>` interno por `<section>` para evitar anidar un `main` dentro de `SidebarInset`, que ya renderiza como `main`.
- El footer queda dentro del shell `Header / Contenido / Footer` sin expandir la página por debajo.

## No incluido

- No modifica DB.
- No modifica endpoints.
- No modifica Swagger.
- No cambia lógica de pago, Stripe ni descarga de recibos.

## QA sugerido

1. Entrar a `/dashboard/mi-cuenta/pagar-cuota`.
2. Probar F12 mobile.
3. Salir de F12 mobile.
4. Ir al final de la pantalla y confirmar que no queda espacio después del footer.
5. Repetir en `/dashboard/mi-cuenta/historial-pagos`.
6. Confirmar que los botones de historial, pago con Stripe y descarga de recibos siguen operativos.
