# Evolución Física — Sex Name Priority v20

## Objetivo

Corregir el caso de Laura Fernández donde el comparador seguía usando silueta masculina aunque el nombre visible del socio indique femenino.

## Causa

La lógica anterior del patch v19 revisaba primero el sexo explícito de los registros de evolución. Si algún registro venía con `sexo_referencia = masculino`, esa marca pisaba el fallback por nombre.

## Cambio

`resolveReferenceSex` ahora prioriza el sexo inferido desde el nombre visible `socioNombre` cuando el nombre es reconocido. Luego, si no puede inferir desde el nombre, recién usa campos explícitos de los registros y, por último, inferencia por medidas.

## Qué NO se tocó

No se modificaron calibraciones visuales:
- `<image />` con `x`, `y`, `width`, `height`;
- `overlayTransform`;
- `MUSCLE_TRANSFORMS`;
- `PAIRED_MUSCLE_TRANSFORMS`;
- radios `shoulderRx`, `chestRx`, `waistRx`, `hipRx`, `abdomenRx`.

## Validación

- Laura Fernández debe cargar silueta femenina tanto en Antes como en Después.
- Un socio con nombre masculino reconocido debe cargar silueta masculina.
- Si el nombre no es reconocido, se conserva la lógica anterior.
