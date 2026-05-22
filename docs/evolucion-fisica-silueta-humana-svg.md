# Evolución física - Silueta humana SVG

## Objetivo

Reemplazar el enfoque visual geométrico/3D experimental por una silueta frontal humanizada construida con SVG, curvas y regiones corporales orgánicas.

## Decisión técnica

Para la visualización final del módulo de evolución física se prioriza una silueta SVG frontal por encima del prototipo 3D geométrico.

Motivos:

- Mayor parecido visual con un cuerpo humano.
- Mejor control de curvas anatómicas.
- Menor complejidad técnica.
- Mejor estabilidad en Next.js.
- Mejor compatibilidad futura con PDF.
- No requiere rotación ni cámara 3D.
- Permite comparar antes vs. ahora de forma clara.

## Alcance de esta feature

- Agrega `EvolucionFisicaHumanSilhouette.tsx`.
- Reemplaza en el dashboard la visualización 2.5D/3D por una silueta humana frontal SVG.
- Mantiene métricas laterales y lectura automática.
- Mantiene gráficos, tabla, PDF, Excel y modal existentes.
- No toca base de datos.
- No toca APIs.
- No toca migraciones.

## Criterio visual

La silueta debe verse humana, frontal y curva. No debe parecer un cuerpo armado con esferas, cilindros, cajas o primitivas geométricas.

## Futuras iteraciones

1. Crear variantes visuales masculina/femenina más diferenciadas.
2. Mejorar manos, pies y transición de hombros.
3. Agregar zonas corporales con intensidad por grasa/masa muscular.
4. Reutilizar la silueta en PDF.
5. Explorar interpolación suave entre registro inicial y última medición.
