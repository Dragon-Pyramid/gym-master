# Admin Socios 360 — footer whitespace fix v1

## Rama

`feature/admin-socios-360-profile-v1`

## Objetivo

Eliminar el espacio en blanco posterior al footer en `/dashboard/socios` al alternar entre viewport mobile/F12 y desktop.

## Alcance

- Se ajusta el shell vertical de la pantalla de socios a `100dvh`.
- El contenedor raíz queda con `h-[100dvh]`, `max-h-[100dvh]`, `min-h-0` y `overflow-hidden`.
- `SidebarInset` queda con grilla controlada `Header / Contenido / Footer`.
- El contenido central mantiene scroll interno.
- Se agrega padding inferior controlado dentro del área scrollable para evitar cortes visuales.

## Archivos modificados

- `src/app/dashboard/socios/page.tsx`

## Sin cambios

- No modifica DB.
- No modifica endpoints.
- No modifica Swagger.
- No altera la lógica del modal 360 ni de exportaciones.

## QA sugerido

1. Entrar como admin a `/dashboard/socios`.
2. Abrir y cerrar F12 mobile.
3. Bajar hasta el footer.
4. Confirmar que no queda espacio blanco después del footer.
5. Abrir modal 360 y confirmar que conserva scroll interno.
6. Ejecutar `npm run build`.
