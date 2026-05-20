# PR: Auditoría inicial de cuotas, pagos y vencimientos

## Descripción

Este PR incorpora una primera auditoría técnica del módulo de cuotas, pagos y vencimientos de Gym Master, tomando como base el estado actualizado del repositorio y del dump de base de datos `backup_completo_gym_master_20052026.sql`.

El objetivo de este bloque es documentar el estado real antes de implementar cambios de lógica o migraciones, especialmente porque el módulo de pagos afecta reglas críticas del negocio: cuota vencida, socios activos/inactivos, pagos manuales, Stripe, pagos adelantados y métricas financieras.

## Cambios incluidos

- Se agrega documentación de auditoría para cuotas, pagos y vencimientos.
- Se agrega script SQL de diagnóstico para revisar estructura, datos, RLS, policies, pagos, cuotas e historial de precios.
- Se documentan hallazgos sobre el modelo actual de datos.
- Se identifican riesgos actuales en servicios y APIs.
- Se deja preparado el camino para una futura migración controlada con Supabase CLI.

## Archivos agregados

```txt
database/scripts/diagnostico_cuotas_pagos_vencimientos.sql
docs/cuotas-pagos/auditoria-cuotas-pagos-vencimientos.md
docs/pr/pr-cuotas-pagos-vencimientos-auditoria.md
docs/informes/informe-ejecutivo-cuotas-pagos-auditoria.md
```

## Hallazgos principales

- La tabla `pago` no tiene registros cargados en el dump actualizado.
- La tabla `pago` no tiene campos explícitos para período cubierto, meses cubiertos, método de pago, estado ni referencias Stripe.
- El servicio actual de eliminación de pagos intenta actualizar `activo = false`, pero la tabla `pago` no posee columna `activo`.
- El formulario de pagos solicita más campos de los que realmente usa la API.
- Stripe crea una sesión con `socio_id` y `cuota_id`, pero el webhook vuelve a llamar a la lógica genérica de `createPago` y no conserva trazabilidad completa de Stripe.
- Existe `obtener_evolucion_cuota()` para evolución histórica de precios.
- Existe `sp_analisis_conducta_pagos()`, pero requiere pagos reales para generar métricas útiles.

## Validaciones sugeridas

Ejecutar el script de diagnóstico en Supabase local o remoto:

```bash
docker exec -i supabase_db_gym-master psql -U postgres -d postgres < database/scripts/diagnostico_cuotas_pagos_vencimientos.sql
```

También ejecutar:

```bash
npm run build
```

## Alcance

Este PR es principalmente documental y de diagnóstico. No modifica todavía código productivo ni estructura de base de datos.

## Próximos pasos

- Diseñar modelo definitivo para pagos/cobertura de cuotas.
- Definir si `historial_precios_cuota` será global o por socio.
- Agregar migración formal si se requieren campos nuevos en `pago`.
- Probar toda migración primero con Supabase local.
- Corregir pago manual desde administrador.
- Corregir trazabilidad de Stripe.
- Incorporar dashboard de cuotas vencidas y métricas BI.
