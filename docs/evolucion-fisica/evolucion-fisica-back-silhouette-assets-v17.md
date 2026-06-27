# Evolución Física — Back Silhouette Assets v17

## Objetivo

Agregar siluetas PNG reales para la vista **Espalda**, usando los assets ubicados en la misma carpeta pública que las siluetas actuales:

- `/images/evolucion-fisica/siluetas/male-athletic-back.png`
- `/images/evolucion-fisica/siluetas/female-athletic-back.png`

## Base usada

Este patch fue regenerado tomando como base el archivo `EvolucionFisicaBeforeAfterStudio.tsx` que Gustavo compartió después de sus calibraciones manuales.

## Qué se modificó

- Se agregaron rutas `back` dentro de `HUMAN_SILHOUETTES`.
- Se agregó `getBackSilhouetteSrc(metrics)`.
- En `BodyMapSvg`, si `bodyView === "back"`, se usa la imagen posterior.
- Se reemplazó el dibujo SVG posterior simplificado por el mismo mecanismo de `<image />` usado en frente.

## Qué NO se tocó

Se conservaron las calibraciones actuales de Gustavo:

- `MUSCLE_TRANSFORMS`
- `PAIRED_MUSCLE_TRANSFORMS`
- `overlayTransform`
- valores del `<image />`:
  - `x={female ? "6" : "4"}`
  - `y={female ? "12" : "8"}`
  - `width={female ? "247" : "250"}`
  - `height="550"`
  - `preserveAspectRatio="xMidYMin meet"`
  - `opacity={muted ? 0.4 : 0.98}`
  - `style.filter`
- radios calibrados:
  - `shoulderRx = 60 * model.shoulder`
  - `chestRx = 50 * model.chest`
  - `waistRx = 42 * model.waist`
  - `hipRx = 42 * model.hip`
  - `abdomenRx = 33 * model.abdomen`

## Nota

El patch asume que los PNG ya existen en:

`public/images/evolucion-fisica/siluetas/`
