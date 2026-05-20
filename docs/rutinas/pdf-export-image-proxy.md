# Rutinas - Corrección de imágenes en exportación PDF

## Contexto

Durante la validación de la rama `feature/rutinas-pdf-export`, el PDF comenzó a generarse correctamente con días y ejercicios, pero algunas imágenes aparecían como `Imagen no disponible` aunque sí se visualizaban correctamente dentro de la pantalla de rutinas.

## Causa probable

El frontend puede mostrar imágenes externas directamente en el navegador, pero la generación PDF necesita convertir esas imágenes a `canvas`/`dataURL` para insertarlas en `jsPDF`. Algunas URLs externas no permiten esa conversión por restricciones de CORS, por lo que el navegador carga la imagen visualmente pero bloquea su lectura para exportación.

## Solución aplicada

Se agregó un endpoint interno:

```txt
GET /api/image-proxy?url=<imagen>
```

Este endpoint obtiene la imagen desde el servidor y la devuelve desde el mismo origen de Gym Master, permitiendo que la utilidad de PDF pueda convertirla correctamente a `dataURL`.

También se amplió la normalización de campos de imagen para soportar variantes como:

- `imagen`
- `imagen_url`
- `imagenUrl`
- `url_imagen`
- `gif_url`
- `gifUrl`
- `gif`
- `video_url`
- `videoURL`

## Validación esperada

1. Abrir una rutina con ejercicios que tengan imagen visible en pantalla.
2. Presionar `Descargar rutina`.
3. Confirmar que el PDF incluye las imágenes que antes aparecían como no disponibles.
4. Confirmar que los ejercicios sin imagen real siguen mostrando fallback.

## Alcance

Esta corrección pertenece a la rama de exportación PDF y no modifica la generación de rutinas ni los seeds de ejercicios.
