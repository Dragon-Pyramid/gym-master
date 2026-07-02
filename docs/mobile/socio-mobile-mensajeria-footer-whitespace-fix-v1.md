# Socio mobile mensajería footer whitespace fix v1

Ajuste local de layout para `/dashboard/mensajes`.

## Problema

Al probar la pantalla en F12 mobile y volver a desktop, el documento podía quedar con scroll sobrante y espacio vacío después del footer.

## Solución

- El shell de la página queda limitado a `100dvh`.
- El contenido central pasa a ser el área scrollable.
- El footer queda fuera del área scrollable y anclado al final del shell.
- Se mantiene la estructura Header / Contenido / Footer.

## Alcance

No modifica base de datos, endpoints, Swagger ni el flujo administrativo.
