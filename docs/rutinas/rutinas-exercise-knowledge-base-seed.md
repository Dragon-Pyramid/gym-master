# Rutinas — Base profesional de ejercicios y conocimiento inicial

**Feature:** `feature/rutinas-exercise-knowledge-base-seed`  
**Fecha:** 2026-05-26  
**Proyecto:** Gym Master

## Objetivo

Ampliar la base de ejercicios para que la generación de rutinas deje de depender casi exclusivamente del objetivo **Volumen** y pueda trabajar con todos los objetivos disponibles en el sistema:

1. Volumen
2. Definición
3. Bajar de peso
4. Aumentar fuerza
5. Mejorar resistencia
6. Rehabilitación física
7. Salud general
8. Preparación para competencia
9. Condición física postparto
10. Control del estrés

La mejora mantiene compatibilidad con el frontend actual, el PDF de rutinas y el RPC `generar_rutina_socio`.

## Cambios de base de datos

### `public.ejercicio`

Se agregan columnas opcionales para enriquecer cada ejercicio sin romper el flujo existente:

- `nombre_en`
- `descripcion`
- `descripcion_en`
- `tipo_ejercicio`
- `patron_movimiento`
- `equipamiento`
- `dificultad`
- `orden_sugerido`
- `series_sugeridas`
- `repeticiones_sugeridas`
- `descanso_sugerido_seg`
- `rpe_sugerido`
- `intensidad`
- `frecuencia_semanal_sugerida`
- `contraindicaciones`
- `video_youtube_url`
- `youtube_video_id`
- `imagen_origen`
- `cloudinary_public_id`
- `media_actualizada_en`
- `activo`

Esto prepara el camino para el futuro RAG `gym-master-rag-coach`, soporte bilingüe y banco de imágenes/videos.

### `public.rutina_generacion_regla`

Nueva tabla con reglas por objetivo/nivel:

- series sugeridas
- repeticiones sugeridas
- descanso
- RPE
- intensidad
- frecuencia semanal sugerida
- cardio recomendado
- criterio de programación
- advertencias

Esto evita tener la lógica fija dentro del procedimiento y permite evolucionar la generación de rutinas con criterio técnico.

### `public.ejercicio_media`

Nueva base foundation para media de ejercicios:

- imagen
- GIF
- video
- YouTube
- thumbnail
- origen: Cloudinary, YouTube, externa, local o fallback
- `cloudinary_public_id`
- `youtube_url`
- `youtube_video_id`

Esta tabla deja preparado el camino para migrar imágenes externas a Cloudinary y asociar videos de YouTube por ejercicio.

## Seed profesional

Se cargan ejercicios para los objetivos que no tenían cobertura suficiente, cruzando:

- objetivos 2 a 10
- niveles inicial, intermedio y avanzado
- grupos musculares principales 1 a 8
- mínimo de 4 ejercicios por grupo/objetivo/nivel

Esto permite que `generar_rutina_socio` encuentre ejercicios para combinaciones que antes fallaban o estaban vacías.

## Generación de rutinas

Se actualiza `public.generar_rutina_socio` para:

- usar reglas desde `rutina_generacion_regla`;
- respetar ejercicios activos;
- priorizar orden sugerido;
- mantener dos grupos musculares por día cuando haya disponibilidad;
- evitar repetir ejercicios de la rutina reciente del socio en una ventana de 45 días;
- devolver JSON enriquecido pero compatible con el frontend actual.

El JSON conserva claves existentes como:

- `dias`
- `ejercicios`
- `id`
- `nombre`
- `grupo`
- `imagen`
- `series`
- `reps`
- `descanso_seg`

Y agrega metadatos futuros:

- `grupo_nombre`
- `tipo_ejercicio`
- `patron_movimiento`
- `equipamiento`
- `video_youtube_url`
- `rpe`
- `intensidad`

## Media y Cloudinary

La migración no sube archivos a Cloudinary. Solo deja la estructura preparada.

La estrategia futura recomendada es:

1. seleccionar ejercicio existente;
2. ver imagen actual;
3. subir imagen/GIF a Cloudinary;
4. guardar `url` y `cloudinary_public_id`;
5. cargar link de YouTube recomendado;
6. marcar media principal;
7. usar imagen/GIF en web/mobile y thumbnail en PDF.

## Validación

Ejecutar:

```bash
docker exec -i supabase_db_gym-master psql -U postgres -d postgres < database/scripts/validar_rutinas_exercise_knowledge_base_seed.sql
```

Resultado esperado:

- columnas nuevas: `OK`
- tabla `rutina_generacion_regla`: `OK`
- tabla `ejercicio_media`: `OK`
- reglas objetivo/nivel: mínimo 30
- cada objetivo/nivel: mínimo 32 ejercicios
- cada objetivo/nivel/grupo principal: mínimo 4 ejercicios

## Próximas features relacionadas

- `feature/rutinas-exercise-media-catalog`
- `feature/rag-rutinas-dataset-prompts`
- `feature/rag-rutinas-coach-knowledge-base`
- `feature/rag-rutinas-assistant`
- `feature/i18n-es-en`
