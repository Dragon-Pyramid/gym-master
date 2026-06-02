# Terminal de asistencia - ajuste de aviso e expiración JWT

## Alcance

Este ajuste mejora la pantalla Terminal de asistencia para uso en monitores Full HD de 21 a 23 pulgadas.

## Cambios

- Reduce aproximadamente a la mitad el alto visual de la imagen/banner del aviso.
- Centra la imagen del aviso con `background-size: contain` para que funcione bien con logos o imágenes 5:4.
- Eleva el texto principal y la descripción de la promoción.
- Mantiene el QR siempre visible.
- Mantiene el panel derecho para asistencias recientes o avisos temporizados.
- Extiende la duración del JWT de sesión de `3h` a `12h` por defecto, configurable con `JWT_EXPIRES_IN`.

## Nota operativa

Si la terminal ya estaba abierta con un token anterior expirado, se debe cerrar sesión e iniciar sesión nuevamente para obtener un JWT nuevo con la nueva duración.

