# Rutinas — Fallback visual para ejercicios sin imagen

## Objetivo

Esta feature agrega un fallback visual versionado para ejercicios que no tienen imagen cargada, especialmente los ejercicios incorporados para niveles Inicial e Intermedio.

El objetivo principal es corregir el comportamiento donde el sistema no mostraba el ícono/botón de visualización cuando `public.ejercicio.imagen` estaba en `NULL`.

## Alcance

- Se agrega un asset local: `/images/exercises/gym-master-exercise-fallback.svg`.
- Se agrega una migración SQL que actualiza ejercicios sin imagen de niveles Inicial e Intermedio.
- No se reemplazan imágenes existentes.
- No se eliminan datos.
- Queda abierta la posibilidad de cargar imágenes reales por ejercicio en una feature posterior.

## Archivo visual agregado

```txt
public/images/exercises/gym-master-exercise-fallback.svg
```

## Migración agregada

```txt
supabase/migrations/202605202000_rutinas_exercise_images_fallback.sql
```

## Validación

```txt
database/scripts/validar_rutinas_exercise_images_fallback.sql
```

## Flujo de validación recomendado

1. Aplicar la feature con `robocopy`.
2. Ejecutar Supabase local.
3. Validar migración local.
4. Aplicar remoto con Supabase CLI.
5. Generar una rutina Inicial o Intermedia.
6. Confirmar que el botón/ícono de imagen aparece.
7. Confirmar que el PDF de rutina muestra imagen o fallback visual.

## Pendiente futuro

Esta feature no reemplaza la carga de imágenes reales. El backlog futuro debería incluir:

- Mapear ejercicios por grupo muscular.
- Cargar imágenes/gifs reales por ejercicio.
- Definir fuente/licencia de recursos visuales.
- Mejorar fallback por grupo muscular.
