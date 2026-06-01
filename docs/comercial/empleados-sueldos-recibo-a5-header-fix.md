# Fix recibo de sueldo A5 - encabezado

Se ajustó el encabezado del generador de PDF para formatos compactos como A5 vertical.

## Motivo

En recibos de sueldo A5, los textos de marca del gimnasio y el título/subtítulo del recibo podían solaparse por falta de ancho horizontal.

## Ajuste

- El encabezado ahora detecta formatos compactos.
- Marca y título usan columnas separadas con ancho máximo.
- Subtítulos se dividen en líneas controladas.
- Se mantiene el formato A5 vertical para recibos individuales.
- No modifica el listado general de sueldos ni otros reportes A4.
