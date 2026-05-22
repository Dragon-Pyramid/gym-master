# Evolución física - Silueta humana v8 sin fantasma

## Resumen

Esta iteración corrige el efecto fantasma detectado en la v7. La causa era la superposición visible de dos referencias biométricas completas: una soft y una athletic.

## Cambio técnico

En lugar de renderizar ambas imágenes con opacidad parcial, la v8 calcula un `fitnessScore` por registro y elige una sola imagen dominante:

- `soft` cuando la composición corporal está más cerca del estado inicial/robusto.
- `athletic` cuando la composición corporal está más cerca de un estado atlético o de recomposición.

Luego aplica escalado sutil por medidas y mantiene highlights internos.

## Alcance

- No modifica base de datos.
- No modifica APIs.
- No modifica PDF.
- No modifica charts ni tabla.
- Reemplaza `EvolucionFisicaHumanSilhouette.tsx`.
- Mantiene assets en `public/images/evolucion-fisica/siluetas`.
