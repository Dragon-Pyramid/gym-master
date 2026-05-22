# Evolucion fisica - silueta humana SVG v2

## Resumen
Esta iteracion reemplaza la silueta anterior por un enfoque SVG mas humano y mas cercano a una silueta real frontal.

## Cambios principales
- Variantes separadas para cuerpo masculino y femenino.
- Seleccion por sexo usando `sexo_referencia` y fallback por inferencia basica.
- Contornos mas curvos en cabeza, torso, cadera, brazos y piernas.
- Conserva lectura visual estilo Gym Master con glow cyan y fondo oscuro.
- Mantiene las tarjetas de metricas y la lectura automatica de cambios.

## Alcance
- No modifica base de datos.
- No modifica APIs.
- No modifica la logica del PDF.
- Se enfoca en el componente de silueta del dashboard.

## Proxima mejora sugerida
- Refinar todavia mas cuello, hombros y zona de cadera.
- Llevar la misma silueta humana al PDF de evolucion fisica.
