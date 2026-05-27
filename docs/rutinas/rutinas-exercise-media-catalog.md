# Feature: Catálogo de media de ejercicios

## Rama

`feature/rutinas-exercise-media-catalog`

## Objetivo

Crear una administración inicial para homogeneizar la media visual de ejercicios en Gym Master y preparar la base para web, mobile, PDF y futuro RAG.

La pantalla permite buscar ejercicios existentes, ver su imagen actual, subir una imagen/GIF a Cloudinary y asociar un video de YouTube recomendado.

## Alcance implementado

- Nueva pantalla administrativa: `/dashboard/rutinas/media`.
- Nuevo endpoint de catálogo: `GET /api/rutinas/ejercicios-media`.
- Nuevo endpoint de actualización: `PATCH /api/rutinas/ejercicios-media`.
- Nuevo endpoint de subida Cloudinary: `POST /api/rutinas/ejercicios-media/upload`.
- Actualización de `ejercicio.imagen`, `ejercicio.imagen_origen`, `ejercicio.cloudinary_public_id`, `ejercicio.video_youtube_url`, `ejercicio.youtube_video_id` y `ejercicio.media_actualizada_en`.
- Registro/renovación de media principal en `ejercicio_media`.
- Filtros por objetivo, nivel y estado de media.
- Resumen de pendientes Cloudinary, pendientes YouTube y fallback.
- Documentación Swagger/OpenAPI actualizada.

## Criterio técnico

Cloudinary queda como fuente recomendada para imágenes/GIFs porque evita URLs externas rotas, permite optimización y mantiene control de los recursos visuales.

YouTube queda como soporte didáctico por ejercicio. El sistema almacena URL y `youtube_video_id` para mostrar un botón de video en rutinas y futuras experiencias mobile/PDF/RAG.

## Seguridad

La administración de media queda restringida a rol administrador.

Los endpoints devuelven:

- `401` si falta token o el token es inválido.
- `403` si el usuario autenticado no es administrador.
- `400` para payloads o archivos inválidos.
- `500` para errores internos no controlados.

## Próximos pasos sugeridos

- Cargar progresivamente imágenes/GIFs reales por ejercicio.
- Asociar videos de YouTube curados.
- Crear proceso de revisión de URLs externas existentes.
- Agregar miniaturas específicas para PDF si se requiere.
- Vincular esta base con `gym-master-rag-coach`.
