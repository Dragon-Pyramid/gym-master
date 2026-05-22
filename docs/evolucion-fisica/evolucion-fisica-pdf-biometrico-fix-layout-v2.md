# Fix layout v2 - PDF biométrico

## Problema

La primera versión del PDF biométrico ubicaba la lectura automática en una columna lateral derecha. En A4 vertical quedaba demasiado angosta y los textos entraban ajustados.

## Solución

La sección biométrica se reorganizó:

1. Las cards `ANTES` y `AHORA` quedan arriba, lado a lado, con mayor ancho.
2. La tarjeta `LECTURA AUTOMÁTICA / Cambios corporales detectados` queda debajo de ambas, a ancho completo.
3. El icono del título se desplaza a la derecha del texto para evitar superposición visual.
4. La lectura automática usa una grilla de 3 columnas x 2 filas para mostrar las variaciones.

## Alcance

- No modifica base de datos.
- No modifica APIs.
- No cambia el logo real del PDF.
- No altera el historial, mediciones segmentarias ni gráficos.
