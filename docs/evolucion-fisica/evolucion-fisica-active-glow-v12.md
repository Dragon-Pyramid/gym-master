# Evolución Física — Active Muscle Glow v12

## Objetivo

Cuando el usuario hace click sobre una zona corporal, el músculo/grupo seleccionado debe encenderse con más intensidad visual y efecto glow, sin volver a dominar toda la silueta humana.

## Cambios

- Se incrementa la opacidad del grupo activo.
- Se aplica color más intenso al grupo seleccionado.
- Se agrega glow fuerte mediante `drop-shadow`.
- Se aumenta el borde del grupo activo para que sea más claro.
- Se agrega un micro `scale(1.015)` al hotspot activo para dar sensación de foco.
- Los grupos no activos siguen sutiles para mantener la silueta humana como protagonista.

## Archivo principal

- `src/components/dashboard/evolucion-fisica/EvolucionFisicaBeforeAfterStudio.tsx`

## Validación

1. Entrar al detalle de evolución física.
2. Hacer click en distintos grupos: muslo, pantorrilla, cintura, abdomen, pecho, hombros.
3. Confirmar que el grupo seleccionado se enciende con más color y glow.
4. Confirmar que los demás grupos siguen sutiles.
5. Probar Slider, Superpuesto y Heatmap.
