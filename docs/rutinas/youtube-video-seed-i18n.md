# Gym Master — YouTube por ejercicio ES/EN

Feature: `feature/rutinas-exercise-youtube-video-seed-i18n`

## Objetivo

Preparar el catálogo de ejercicios para asociar videos recomendados de YouTube por idioma, priorizando español y dejando preparado inglés para i18n, web, PDF, APK de socios y futuro RAG coach.

## Campos agregados

- `youtube_url_es`
- `youtube_video_id_es`
- `youtube_url_en`
- `youtube_video_id_en`
- `youtube_source`
- `youtube_verified_at`
- `youtube_review_status`
- `youtube_review_notes`

## Estados de revisión

- `pendiente`
- `sugerido`
- `validado`
- `rechazado`
- `requiere_revision`

## CSV de importación

Encabezado requerido:

```csv
id_ejercicio,nombre_ejercicio,youtube_url_es,youtube_url_en,youtube_source,youtube_review_status,youtube_review_notes
```

Reglas:

- Usar `id_ejercicio` cuando sea posible.
- `nombre_ejercicio` queda como fallback de búsqueda exacta normalizada.
- Primero ejecutar preview sin aplicar cambios.
- Aplicar cambios solo después de revisar coincidencias.
- No usar videos dudosos, peligrosos o de técnica incorrecta.
- Priorizar español; inglés queda preparado para i18n.

## Flujo recomendado

1. Exportar ejercicios sin YouTube desde DB o desde el panel.
2. Curar videos externamente o por script con YouTube Data API.
3. Revisar CSV manualmente.
4. Cargar CSV en `/dashboard/rutinas/media`.
5. Ejecutar preview.
6. Aplicar cambios.
7. Validar filtros `Pendiente YouTube ES`, `Con YouTube ES`, `Con YouTube EN`, `YouTube validado`.

## Nota

Esta feature no busca automáticamente videos desde ChatGPT ni aplica videos sin revisión. La selección de videos debe ser controlada, auditada y segura para evitar mostrar técnicas incorrectas al socio.
