# PR: Auditoría de base de datos, DER y APIs/RPC — Gym Master

## Descripción

Este PR agrega documentación técnica y scripts de diagnóstico para continuar la auditoría de Gym Master después del checkpoint single-tenant ya mergeado a `main`.

El objetivo es mapear el estado real de la base Supabase/PostgreSQL, las relaciones DER, los procedimientos almacenados, las APIs que consumen RPC y las inconsistencias detectadas antes de realizar migraciones correctivas.

## Cambios incluidos

- Se agrega `docs/database/der-y-rpc-audit.md` con:
  - inventario de tablas detectadas en el backup,
  - columnas principales,
  - relaciones FK,
  - DER conceptual en Mermaid,
  - funciones/RPC disponibles,
  - RPC consumidas desde el código,
  - APIs detectadas,
  - estado de integración Business Intelligence,
  - hallazgos e inconsistencias.
- Se agrega `database/scripts/diagnostico_der_rls_rpc.sql` con consultas de diagnóstico no destructivas para Supabase SQL Editor.
- Se agrega `docs/informes/informe-ejecutivo-der-rpc.md` con un resumen ejecutivo del estado de base de datos, DER, Data Science y BI.

## Hallazgos principales

- Existen procedimientos almacenados de Data Science ya implementados en PostgreSQL/Supabase.
- Existen APIs Next.js que consumen varias de esas RPC.
- El frontend ya muestra algunas gráficas iniciales, pero todavía falta una capa visual de Business Intelligence más ordenada y completa.
- El código invoca `sp_prediccion_abandono` y `sp_top_inactivos`, pero esas funciones no aparecen en el backup analizado.
- Hay policies `dev_all_*` abiertas que deben tratarse como temporales de desarrollo.
- Hay posibles inconsistencias de modelo: horarios de entrenadores duplicados, relación circular venta/venta_detalle y dieta sin campo JSONB dedicado.

## Validación

Este PR es documental y de diagnóstico. No modifica lógica productiva ni ejecuta migraciones.

Validaciones sugeridas:

```bash
git diff -- docs/ database/scripts/
```

Opcional en Supabase:

```sql
-- Ejecutar secciones del archivo:
-- database/scripts/diagnostico_der_rls_rpc.sql
```

## Próximo paso recomendado

Después de mergear este PR, crear una rama específica para correcciones reales de base de datos y/o una rama para diseño del módulo visual de Business Intelligence.
