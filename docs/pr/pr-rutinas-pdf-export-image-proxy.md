## Descripción

Este PR corrige la exportación PDF de rutinas para que las imágenes de ejercicios se incluyan correctamente cuando existen en la pantalla de rutina.

Durante la validación se detectó que el PDF mostraba `Imagen no disponible` en ejercicios que sí tenían imagen visible en el frontend. La causa probable era una restricción de CORS al convertir imágenes externas a `canvas`/`dataURL` para insertarlas en `jsPDF`.

## Cambios principales

- Se agrega endpoint interno `GET /api/image-proxy` para servir imágenes externas desde el mismo origen de la aplicación.
- Se actualiza la utilidad `rutinaPdf.ts` para convertir imágenes usando el proxy cuando la URL es externa.
- Se amplía la normalización de campos de imagen para reconocer más variantes (`imagen`, `imagen_url`, `imagenUrl`, `url_imagen`, `gif_url`, `gifUrl`, `gif`, `video_url`, `videoURL`).
- Se mantiene fallback visual para ejercicios que realmente no tengan imagen.
- Se documenta la corrección en `docs/rutinas/pdf-export-image-proxy.md`.

## Validaciones sugeridas

- Generar PDF de una rutina avanzada con imágenes existentes.
- Verificar que las imágenes visibles en pantalla también aparezcan en el PDF.
- Generar PDF de una rutina inicial/intermedia y confirmar que los ejercicios sin imagen real muestren fallback.
- Ejecutar `npm run build`.

## Alcance

Este PR no modifica la generación de rutinas ni los datos de ejercicios. Solo mejora la exportación visual del PDF.
