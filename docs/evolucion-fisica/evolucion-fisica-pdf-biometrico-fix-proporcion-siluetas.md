# Fix PDF biométrico - proporción de siluetas

## Problema

La corrección anterior igualó la altura visual entre las siluetas, pero al limitar el ancho de la imagen podía comprimir horizontalmente la silueta inicial. En casos de composición soft/robusta, esto hacía que el cuerpo se viera demasiado delgado.

## Solución

Se ajustó el render del panel biométrico:

- se mantiene una altura objetivo similar entre registros;
- se calcula el ancho respetando la proporción natural de la imagen;
- se elimina el límite que comprimía el ancho;
- se ensancha el panel oscuro para que la silueta robusta entre correctamente.

## Alcance

- No modifica base de datos.
- No modifica APIs.
- No cambia el logo.
- No altera tablas, gráficos ni lectura automática.
- Solo corrige proporciones visuales de las siluetas en el PDF.
