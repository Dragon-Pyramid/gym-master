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

El mecanismo standalone de `[db.seed]` está deshabilitado porque Gym Master no mantiene un `supabase/seed.sql`. Los datos demo históricos que continúan versionados forman parte de la propia cadena de migraciones y no de un seed independiente.

El repositorio público no constituye por sí solo un baseline completo para reconstruir una base vacía desde cero: parte del histórico remoto se conserva como migraciones placeholder sin SQL por política de seguridad. Por ese motivo, un `db reset` sobre una base totalmente vacía puede fallar cuando una migración posterior depende de objetos creados en ese histórico. La recuperación completa desde cero debe apoyarse en un baseline o backup privado validado; `db reset` no debe considerarse un mecanismo de disaster recovery de producción.

## Baseline local

La migración `202605200001_initial_schema_from_backup_minimal_rutinas.sql` es un baseline mínimo para validar el módulo de rutinas localmente. La base remota ya contiene su schema histórico, por lo que antes de aplicar migraciones al remoto se deberá marcar este baseline como aplicado y empujar solo los cambios reales posteriores.

## No ejecutar directamente en remoto

No correr `npx supabase db push` hasta validar:

1. Migraciones locales aplicadas.
2. Diagnóstico de ejercicios.
3. RPC `generar_rutina_socio` para nivel Inicial e Intermedio.
4. Build de Next.js.
5. PR revisado y mergeado.
