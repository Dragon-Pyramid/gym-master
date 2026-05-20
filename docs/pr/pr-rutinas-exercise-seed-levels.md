## Descripción

Este PR agrega un flujo correcto con Supabase CLI para validar localmente la generación de rutinas y agrega una migración formal para cargar ejercicios base de Volumen en niveles Inicial e Intermedio.

## Contexto

Durante pruebas funcionales, el endpoint `/api/rutina/generar` y el RPC `generar_rutina_socio` funcionaron para nivel Avanzado, pero fallaron para nivel Inicial e Intermedio porque no existían ejercicios definidos para esas combinaciones de objetivo/nivel.

## Cambios principales

- Se agrega un baseline local mínimo de schema para rutinas basado en el backup actual.
- Se agrega migración formal en `supabase/migrations` para seed de ejercicios.
- Se aseguran catálogos mínimos de niveles, objetivos, grupos musculares y días.
- Se agregan scripts SQL de diagnóstico y validación.
- Se documenta el flujo de Supabase CLI local antes de aplicar cambios remotos.

## Archivos relevantes

- `supabase/migrations/202605200001_initial_schema_from_backup_minimal_rutinas.sql`
- `supabase/migrations/202605200002_seed_workout_exercises_initial_intermediate_levels.sql`
- `database/scripts/diagnostico_rutinas_ejercicios.sql`
- `database/scripts/validar_generacion_rutinas_objetivo_volumen.sql`
- `docs/database/supabase-local-workflow.md`
- `docs/rutinas/seed-ejercicios-niveles.md`

## Validaciones esperadas

- `npx supabase start` aplica baseline y seed sin errores.
- Diagnóstico muestra ejercicios para objetivo 1 / nivel 1 y objetivo 1 / nivel 2.
- `generar_rutina_socio` genera rutina para Inicial e Intermedio.
- `npm run build` continúa pasando.

## Nota operativa

No aplicar `db push` al remoto sin reparar/marcar el baseline como aplicado. La base remota ya posee su schema histórico; el cambio real para remoto es el seed de ejercicios.
