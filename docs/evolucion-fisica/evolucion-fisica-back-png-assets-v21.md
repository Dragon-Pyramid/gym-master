# Evolución Física — Back PNG Assets v21

## Objetivo

Corregir la vista **Espalda** para que use las nuevas siluetas PNG de fondo según sexo:

- masculino: `/images/evolucion-fisica/siluetas/male-athletic-back.png`
- femenino: `/images/evolucion-fisica/siluetas/female-athletic-back.png`

## Causa

La vista frente ya elegía correctamente la silueta según sexo, pero la vista espalda seguía renderizando el SVG interno `backOutline`, por eso no aparecían las nuevas imágenes incorporadas.

## Cambios

- Se agregan rutas `back` a `HUMAN_SILHOUETTES`.
- Se agrega `getBackSilhouetteSrc(metrics)`.
- `BodyMapSvg` ahora usa:
  - `getFrontSilhouetteSrc(metrics)` cuando `bodyView === "front"`;
  - `getBackSilhouetteSrc(metrics)` cuando `bodyView === "back"`.
- Se reemplaza el SVG posterior interno por el mismo bloque `<image />` usado por el frente.

## Qué NO se tocó

Se preservan las calibraciones existentes:

- `<image />`:
  - `x={female ? "6" : "4"}`
  - `y={female ? "12" : "8"}`
  - `width={female ? "247" : "250"}`
  - `height="550"`
- `overlayTransform`
- `MUSCLE_TRANSFORMS`
- `PAIRED_MUSCLE_TRANSFORMS`
- lógica v20 de prioridad por nombre para evitar mezcla de sexo.

## Nota

Este patch asume que los archivos PNG ya existen en:

`public/images/evolucion-fisica/siluetas/`
