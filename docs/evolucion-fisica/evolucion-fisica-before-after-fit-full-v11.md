# Evolución Física — Full Refinement v11

## Incluye

- Silueta humana refinada y más orgánica.
- Diferenciación visual masculino / femenino.
- Silueta secundaria antigua oculta.
- Forzado temporal de silueta masculina **fit / athletic** para pruebas visuales.
- Viewport / clipPath / contenedor ampliados para evitar corte de pies o parte baja de la silueta.
- Figuras geométricas del overlay suavizadas al ~20% para que funcionen como guía y no dominen sobre la figura humana.

## Archivo principal modificado

- `src/components/dashboard/evolucion-fisica/EvolucionFisicaBeforeAfterStudio.tsx`

## Ajustes manuales finos

Si luego querés microajustar la posición o el tamaño de la silueta humana, editá el bloque `<image />`:

- `x` = horizontal
- `y` = vertical
- `width` / `height` = tamaño
