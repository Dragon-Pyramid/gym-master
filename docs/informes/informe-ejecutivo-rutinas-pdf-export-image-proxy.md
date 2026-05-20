# Informe ejecutivo - Corrección de imágenes en PDF de rutinas

## Proyecto

Gym Master

## Rama

`feature/rutinas-pdf-export`

## Resumen ejecutivo

Durante la validación de la exportación PDF de rutinas se detectó que algunas imágenes aparecían como no disponibles dentro del PDF, aunque sí estaban visibles en la pantalla de rutina.

El problema se corrigió incorporando un proxy interno de imágenes y ajustando la utilidad de generación PDF para convertir correctamente imágenes externas antes de insertarlas en el documento.

## Problema detectado

El navegador puede mostrar imágenes externas en pantalla, pero la generación PDF necesita convertirlas a `canvas`/`dataURL`. Cuando el origen remoto no permite CORS, esa conversión falla y el PDF muestra el fallback de imagen no disponible.

## Solución aplicada

- Nuevo endpoint `GET /api/image-proxy`.
- Uso del proxy para imágenes externas al generar PDF.
- Normalización ampliada de campos de imagen.
- Documentación técnica agregada.

## Resultado esperado

Las imágenes que ya se visualizan correctamente en la pantalla de rutinas deben aparecer también en el PDF exportado, manteniendo fallback solo para ejercicios sin imagen real.

## Pendiente relacionado

Para ejercicios iniciales/intermedios cargados recientemente, muchas imágenes siguen en `NULL`. Ese caso deberá resolverse con una futura rama de carga o normalización de imágenes de ejercicios.
