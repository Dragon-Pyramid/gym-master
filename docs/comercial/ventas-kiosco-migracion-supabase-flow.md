# Patch correctivo — flujo Supabase migrations

Este patch reubica la migración de la feature `ventas-kiosco-detalle-consumidor-final` al flujo correcto de Gym Master:

- Migración real: `supabase/migrations/202605292045_ventas_kiosco_detalle_consumidor_final.sql`
- Validación: `database/scripts/validar_ventas_kiosco_detalle_consumidor_final.sql`

Luego de aplicar este patch, usar:

```bash
npx supabase migration list
npx supabase db push
npx supabase migration list
```

Si quedaron archivos anteriores en `database/private`, no commitearlos. Pueden eliminarse localmente si no se necesitan.
