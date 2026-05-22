# Evolución física - Silueta humana SVG v3

## Resumen

Esta iteración reemplaza la construcción visual anterior por un enfoque basado en paths reales de siluetas humanas.

## Cambios principales

- Base masculina obtenida desde path SVG de silueta humana frontal.
- Base femenina obtenida desde path SVG de silueta humana frontal.
- Selección automática por `sexo_referencia`.
- Estilo visual adaptado a Gym Master con gradiente cyan y glow suave.
- Se mantiene la comparación Antes vs. Ahora.
- Se mantienen métricas laterales y lectura automática.

## Alcance

- No modifica base de datos.
- No modifica APIs.
- No modifica PDF.
- No modifica charts ni tabla.
- Solo reemplaza la visualización de silueta humana.

## Nota técnica

En esta versión se prioriza que la figura sea humana y no geométrica. La deformación por zonas queda como iteración posterior, separando o enmascarando áreas del path para hombros, cintura, cadera, brazos y piernas.
