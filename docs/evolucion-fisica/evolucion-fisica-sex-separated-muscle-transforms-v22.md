# Evolución Física — Sex Separated Muscle Transforms v22

## Objetivo

Separar las coordenadas de los músculos poligonales por sexo para que:

- **masculino** conserve su calibración actual;
- **femenino** tenga sus propias coordenadas editables de forma independiente.

## Cambios

En `EvolucionFisicaBeforeAfterStudio.tsx`:

- `MUSCLE_TRANSFORMS` pasa a `MUSCLE_TRANSFORMS_BY_SEX`
- `PAIRED_MUSCLE_TRANSFORMS` pasa a `PAIRED_MUSCLE_TRANSFORMS_BY_SEX`
- `BodyMapSvg` elige la tabla de transforms según `model.sex`
- `BodyPart` ahora recibe `transform` como prop

## Resultado

Ahora podés tocar solo los valores de:

- `MUSCLE_TRANSFORMS_BY_SEX.femenino`
- `PAIRED_MUSCLE_TRANSFORMS_BY_SEX.femenino`

sin afectar al hombre.

## Importante

No se tocaron:

- calibraciones fijas del `<image />`
- `overlayTransform`
- lógica de silueta frente/espalda por sexo
- lógica de glow/heatmap
