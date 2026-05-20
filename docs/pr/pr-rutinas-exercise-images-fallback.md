# PR: Rutinas — fallback visual para ejercicios sin imagen

## Descripción

Este PR agrega un fallback visual para ejercicios de rutinas que no tienen imagen cargada, principalmente los ejercicios de niveles Inicial e Intermedio incorporados recientemente.

El cambio busca corregir el comportamiento donde el sistema no mostraba el ícono de visualización cuando `public.ejercicio.imagen` estaba vacío o en `NULL`.

## Cambios principales

- Se agrega el asset local:
  - `public/images/exercises/gym-master-exercise-fallback.svg`
- Se agrega migración:
  - `supabase/migrations/202605202000_rutinas_exercise_images_fallback.sql`
- Se agrega script de validación:
  - `database/scripts/validar_rutinas_exercise_images_fallback.sql`
- Se documenta el alcance en:
  - `docs/rutinas/rutinas-exercise-images-fallback.md`

## Alcance técnico

La migración:

- No reemplaza imágenes existentes.
- Solo completa ejercicios sin imagen.
- Prioriza niveles Inicial e Intermedio.
- Usa un asset local versionado para mantener compatibilidad con frontend y exportación PDF.

## Validaciones sugeridas

- Ejecutar migración en Supabase local.
- Ejecutar script de validación SQL.
- Aplicar remoto con Supabase CLI.
- Confirmar historial con `npx supabase migration list`.
- Generar rutina Inicial o Intermedia.
- Verificar que el botón/ícono de imagen aparece.
- Exportar rutina a PDF y verificar fallback visual.

## Nota

Este PR no carga imágenes reales por ejercicio. Eso queda para una feature posterior con curaduría visual y validación de licencias.
