# Evolución física - Silueta humana SVG v4 deformaciones

## Resumen

Esta iteración mantiene los paths reales de silueta masculina/femenina y agrega deformaciones por zonas a partir de las medidas del socio.

## Cambios principales

- Se conserva el contorno humano real.
- Se agregan escalas por bandas SVG.
- Las zonas afectadas son hombros, tórax, cintura, cadera, muslos y pantorrillas.
- Se mantiene una deformación global muy sutil para no perder anatomía.
- La intensidad abdominal se vincula al porcentaje de grasa.
- La intensidad torácica se vincula a masa muscular.

## Alcance

- No modifica base de datos.
- No modifica APIs.
- No modifica PDF.
- No modifica charts ni tabla.
- Solo reemplaza el componente `EvolucionFisicaHumanSilhouette.tsx`.

## Nota técnica

La deformación se realiza renderizando el mismo path real en bandas SVG recortadas por `clipPath` y escaladas desde el eje central del cuerpo. Esto permite modificar zonas sin volver a un cuerpo armado con figuras geométricas.
