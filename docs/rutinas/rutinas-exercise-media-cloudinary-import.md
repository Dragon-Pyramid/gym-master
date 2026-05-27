# Feature: Importación de media remota a Cloudinary

## Rama

`feature/rutinas-exercise-media-cloudinary-import`

## Objetivo

Automatizar la migración de imágenes/GIFs externos de ejercicios hacia Cloudinary sin descargar archivos manualmente.

La mejora permite tomar una URL existente de `ejercicio.imagen` o una URL externa ingresada por el administrador, importarla desde backend a Cloudinary y actualizar los campos del ejercicio con la URL segura final.

## Alcance implementado

- Nuevo endpoint: `POST /api/rutinas/ejercicios-media/import`.
- Nueva acción en `/dashboard/rutinas/media`: `Importar URL a Cloudinary`.
- Importación remota de imagen/GIF usando Cloudinary.
- Actualización de:
  - `ejercicio.imagen`
  - `ejercicio.imagen_origen = cloudinary`
  - `ejercicio.cloudinary_public_id`
  - `ejercicio.media_actualizada_en`
- Creación/renovación del registro principal en `ejercicio_media`.
- Actualización de Swagger/OpenAPI.
- Reutilización del flujo visual existente del catálogo de media.

## Seguridad y validaciones

El backend valida:

- Usuario autenticado.
- Rol administrador.
- `id_ejercicio` válido.
- URL http/https.
- Bloqueo de localhost, IP privada o dominios internos.
- Evitar importar URLs que ya pertenecen a Cloudinary.
- Verificación por `HEAD` de:
  - estado HTTP correcto;
  - `content-type` compatible con imagen/GIF;
  - tamaño máximo de 10 MB;
  - timeout para evitar requests lentos.

## Flujo operativo

1. El administrador entra en `/dashboard/rutinas/media`.
2. Busca y selecciona un ejercicio.
3. Usa la URL actual o pega una URL externa.
4. Presiona `Importar URL a Cloudinary`.
5. El backend valida la URL.
6. Cloudinary importa el asset.
7. Gym Master actualiza el ejercicio y su media principal.
8. La pantalla recarga el catálogo y muestra la nueva imagen/GIF desde Cloudinary.

## Próximos pasos sugeridos

- Crear barrido semi-automático de equivalencias para copiar media desde ejercicios con imagen real hacia ejercicios con fallback.
- Usar Volumen Avanzado como fuente prioritaria de imágenes/GIFs.
- Agregar importación masiva seleccionada con reporte de éxitos/errores.
- Integrar validación previa de candidatos dudosos para evitar copiar media entre variantes distintas.
