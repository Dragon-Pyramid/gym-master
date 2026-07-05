# Admin Socios 360 Modal Scroll Fix v1

## Contexto

Durante la QA visual de `feature/admin-socios-360-profile-v1` se detectó que el modal 360° podía quedar visualmente recortado en la parte inferior derecha, especialmente en escritorio con zoom/devtools o viewport reducido.

## Ajuste aplicado

Se ajustó `src/components/modal/SocioViewModal.tsx` para controlar mejor la altura del diálogo y el scroll interno:

- el modal usa una altura máxima basada en `92dvh` y un límite superior seguro;
- el contenedor principal pasa a `flex` con cuerpo `min-h-0`;
- el header queda como bloque fijo superior dentro del modal;
- el cuerpo usa `overflow-y-auto` y `overscroll-contain`;
- se agrega padding inferior para que los últimos bloques no queden pegados al borde;
- los botones del header se acomodan mejor en mobile;
- el bloque de módulos/lectura rápida pasa a dos columnas recién en pantallas amplias.

## Alcance

No modifica endpoints, DB ni permisos. Es un fix visual/responsive del modal 360°.

## QA sugerida

1. Entrar como admin a `/dashboard/socios`.
2. Abrir la acción `360` de un socio.
3. Confirmar que el modal no queda recortado.
4. Hacer scroll dentro del modal hasta el final.
5. Probar F12 mobile y desktop.
6. Confirmar que no hay scroll horizontal ni contenido inaccesible.
