# Descubrimiento automático YouTube por ejercicio

Feature: `feature/rutinas-exercise-youtube-video-seed-i18n`

## Objetivo

Automatizar por corridas la búsqueda de videos de YouTube para ejercicios del catálogo, usando YouTube Data API v3.

El proceso no pisa URLs existentes:

- Si el ejercicio ya tiene `youtube_url_es`, `youtube_video_id_es`, `video_youtube_url` o `youtube_video_id`, se salta ES.
- Si el ejercicio ya tiene `youtube_url_en` o `youtube_video_id_en`, se salta EN.

Los candidatos detectados se guardan como `youtube_review_status = sugerido`, no como validado, para que el administrador revise técnica, canal y calidad antes de aprobarlos.

## Variables de entorno

```env
YOUTUBE_DATA_API_KEY=
YOUTUBE_AUTO_DISCOVERY_BATCH_SIZE=25
YOUTUBE_AUTO_DISCOVERY_REGION_ES=AR
YOUTUBE_AUTO_DISCOVERY_REGION_EN=US
```

La API key no debe versionarse. Solo va en `.env.local` y en variables seguras del entorno donde se ejecute el proceso.

## Endpoint

```http
POST /api/rutinas/ejercicios-media/youtube-auto-discovery
```

Payload ejemplo:

```json
{
  "apply": false,
  "limit": 25,
  "idiomas": ["es", "en"],
  "onlyMissing": true
}
```

- `apply: false`: previsualiza candidatos sin escribir en DB.
- `apply: true`: guarda candidatos en campos vacíos.
- `limit`: cantidad de ejercicios por corrida. Máximo recomendado: 50.
- `idiomas`: `es`, `en` o ambos.

## Recomendación operativa

1. Ejecutar preview con 25 ejercicios.
2. Revisar candidatos.
3. Ejecutar apply.
4. Validar manualmente desde `/dashboard/rutinas/media`.
5. Repetir por corridas hasta completar catálogo.
