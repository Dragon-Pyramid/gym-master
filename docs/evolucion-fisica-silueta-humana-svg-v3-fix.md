# Fix silueta humana SVG v3

## Problema corregido

El build fallaba porque los paths SVG quedaron insertados como strings multilínea en TypeScript.

## Solución

Los paths `MALE_FRONT_PATH` y `FEMALE_FRONT_PATH` fueron reinsertados como strings JS válidos y escapados.

## Alcance

- No modifica base de datos.
- No modifica APIs.
- No modifica PDF.
- No modifica dashboard completo.
- Solo reemplaza `EvolucionFisicaHumanSilhouette.tsx`.
