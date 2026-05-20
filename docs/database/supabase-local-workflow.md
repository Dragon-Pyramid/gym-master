# Gym Master - Supabase CLI local workflow

## Objetivo

Probar migraciones de base de datos en Supabase local antes de aplicar cambios al proyecto remoto.

## Flujo recomendado

```bash
npx supabase stop --no-backup
npx supabase start
```

Si el stack local ya existe y querés reconstruir desde cero:

```bash
npx supabase db reset
```

## Baseline local

La migración `202605200001_initial_schema_from_backup_minimal_rutinas.sql` es un baseline mínimo para validar el módulo de rutinas localmente. La base remota ya contiene su schema histórico, por lo que antes de aplicar migraciones al remoto se deberá marcar este baseline como aplicado y empujar solo los cambios reales posteriores.

## No ejecutar directamente en remoto

No correr `npx supabase db push` hasta validar:

1. Migraciones locales aplicadas.
2. Diagnóstico de ejercicios.
3. RPC `generar_rutina_socio` para nivel Inicial e Intermedio.
4. Build de Next.js.
5. PR revisado y mergeado.
