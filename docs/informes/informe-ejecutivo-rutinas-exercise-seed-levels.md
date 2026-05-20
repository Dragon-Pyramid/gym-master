# Informe ejecutivo - Seed de ejercicios para rutinas Inicial/Intermedio

## Resumen

Se detectó que Gym Master generaba rutinas correctamente para nivel Avanzado, pero fallaba para Inicial e Intermedio por ausencia de ejercicios asociados a objetivo Volumen y esos niveles.

## Decisión técnica

Se corrigió el enfoque para usar Supabase CLI y migraciones formales, en lugar de cargar scripts sueltos. Esto permite probar localmente antes de tocar la base remota y conservar trazabilidad.

## Entregables

- Baseline local mínimo de rutinas.
- Migración formal de seed de ejercicios.
- Scripts de diagnóstico.
- Documentación de flujo local con Supabase CLI.
- Descripción de PR.

## Riesgos

El baseline local no debe empujarse directamente al remoto como cambio nuevo, porque el remoto ya tiene schema. Debe marcarse como aplicado o gestionarse como baseline local de desarrollo.

## Próximo paso

Validar `npx supabase start`, ejecutar los scripts de diagnóstico y probar generación de rutinas para nivel Inicial e Intermedio.
