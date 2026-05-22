# Evolución física - Silueta humana SVG v6 orgánica

## Resumen

Esta versión reemplaza el enfoque de bandas horizontales por una silueta orgánica generada desde curvas SVG continuas.

## Motivo

La versión anterior deformaba el path real mediante franjas horizontales. Aunque permitía modificar zonas, visualmente generaba cortes rectangulares y fragmentos que podían salirse de la curva del cuerpo.

## Cambios principales

- Se elimina la deformación por bandas.
- Se genera una silueta humana frontal con paths orgánicos.
- Las proporciones se recalculan desde las métricas disponibles:
  - peso
  - cintura
  - cadera
  - pecho
  - porcentaje de grasa
  - masa muscular
  - brazo promedio
  - muslo promedio
  - pantorrilla promedio
- Se mantiene selector por sexo masculino/femenino.
- Se mejora la lectura visual del cambio Antes vs. Ahora.
- Se conserva la estética cyan/glow de Gym Master.

## Alcance

- No modifica base de datos.
- No modifica APIs.
- No modifica PDF.
- No modifica charts ni tabla.
- Solo reemplaza `EvolucionFisicaHumanSilhouette.tsx`.

## Próxima mejora

Calibrar rangos reales con más socios y refinar detalles anatómicos finos: manos, pies, hombros y sombreado muscular.
