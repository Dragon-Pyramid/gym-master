# Evolución Física — Human Silhouette Organic v3

## Rama

`feature/evolucion-fisica-before-after-polish-v1`

## Objetivo

Reducir la sensación geométrica/fría del mapa corporal y reforzar una lectura más humana, biológica y empática para el socio.

## Cambios

- Se agranda la silueta humana base frontal para que sea la figura dominante.
- Las zonas interactivas SVG siguen existiendo, pero dejan de sentirse como figuras geométricas principales.
- En modo Slider/Superpuesto las zonas no activas quedan casi transparentes.
- En modo Heatmap se conserva la lectura de progreso, pero con opacidad más suave.
- El grupo seleccionado mantiene highlight claro, sin tapar completamente la silueta.
- Se mantiene soporte visual masculino/femenino usando `sexo_referencia` cuando existe.
- Se conserva oculta la segunda sección comparativa antigua mientras se refina el nuevo estudio principal.

## Resultado esperado

El socio ve primero una silueta humana reconocible y luego, encima, una capa sutil de evolución e interacción. Esto mantiene la potencia analítica del módulo, pero evita una sensación excesivamente matemática o robótica.

## Validación

1. Entrar al detalle de evolución física.
2. Verificar que la silueta se percibe más humana que geométrica.
3. Probar Slider, Superpuesto y Heatmap.
4. Hacer click en grupos corporales.
5. Confirmar que el panel derecho sigue actualizando datos.
6. Probar un registro masculino y uno femenino.
7. Confirmar que la segunda sección antigua no se renderiza.
