# Fix PDF biométrico - altura de siluetas

## Problema

En la sección final del PDF, la silueta `ANTES` podía verse más baja que la silueta `AHORA`.

La causa era la diferencia de proporciones entre los assets biométricos `soft` y `athletic`. Al renderizar con lógica de encaje por ancho/alto, una imagen más ancha quedaba limitada por el ancho del panel y se reducía su altura final.

## Solución

Se ajustó el render de `addBiometricSilhouettePanel` para usar una altura objetivo fija y centrar el ancho calculado proporcionalmente.

## Alcance

- No modifica base de datos.
- No modifica APIs.
- No cambia logo ni layout general.
- Solo ajusta la proporción visual de siluetas en el PDF.
