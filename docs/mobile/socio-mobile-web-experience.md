# Socio mobile web experience

## Rama

`feature/socio-mobile-web-experience`

## Objetivo

Mejorar la experiencia mobile del socio dentro de la aplicación web Gym Master, sin crear una APK nativa ni separar el producto.

Esta feature trabaja sobre la web responsive/PWA conectada al gimnasio. La APK independiente de acompañamiento personal queda para una etapa futura y como otro producto.

## Alcance

### Dashboard del socio

Se agrega un bloque mobile-first de accesos rápidos visibles en celulares:

- Pagar cuota / Mi cuota
- QR / asistencia
- Rutina
- Dieta
- Evolución física
- Ficha médica
- Mensajes

El bloque usa cards táctiles grandes, pensadas para DevTools mobile y uso real en celular.

### Header mobile

Se ajusta el header para mejorar uso en pantallas chicas:

- Header sticky.
- Logo más compacto en mobile.
- Título truncado para evitar desbordes.
- Acciones con menor separación.
- Fecha/hora oculta en mobile para liberar espacio.

## Criterio de diseño

La mejora no convierte Gym Master en APK. Es una experiencia mobile web/PWA para socios conectados a su gimnasio.

## Recorrido manual sugerido

Probar desde Chrome DevTools con:

1. iPhone 12 Pro.
2. Pixel 7 o Pixel 5.
3. Responsive libre a 360px de ancho.
4. Motorola real después del merge.

Rutas sugeridas:

- `/dashboard`
- `/dashboard/mi-cuenta/pagar-cuota`
- `/dashboard/mi-cuenta/historial-pagos`
- `/dashboard/control-asistencia`
- `/dashboard/rutinas/asistente`
- `/dashboard/dietas`
- `/dashboard/evolucion-fisica`
- `/dashboard/ficha-medica`
- `/dashboard/mensajes`

## Checklist visual

- Sin scroll horizontal.
- Header no debe tapar ni romper controles.
- Cards táctiles legibles.
- Botones cómodos para dedo.
- Accesos principales visibles sin abrir el sidebar.
- Textos sin recortes graves.
- La experiencia sigue siendo web/PWA, no APK.

## Base de datos

No requiere migración de base de datos.
