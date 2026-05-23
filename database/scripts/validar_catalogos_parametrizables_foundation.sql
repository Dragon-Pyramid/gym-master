-- -----------------------------------------------------------------------------
-- Gym Master
-- Validación: catálogos parametrizables foundation
-- Uso local:
-- docker exec -i supabase_db_gym-master psql -U postgres -d postgres < database/scripts/validar_catalogos_parametrizables_foundation.sql
-- -----------------------------------------------------------------------------

\echo '== Validando existencia de tablas catálogo =='

select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in (
    'tipo_empleado',
    'medio_pago',
    'tipo_gasto',
    'tipo_ingreso',
    'categoria_producto',
    'tipo_equipamiento',
    'ubicacion_equipamiento',
    'tipo_mantenimiento'
  )
order by table_name;

\echo '== Validando cantidad de seeds por catálogo =='

select 'tipo_empleado' as catalogo, count(*) as total from public.tipo_empleado
union all
select 'medio_pago', count(*) from public.medio_pago
union all
select 'tipo_gasto', count(*) from public.tipo_gasto
union all
select 'tipo_ingreso', count(*) from public.tipo_ingreso
union all
select 'categoria_producto', count(*) from public.categoria_producto
union all
select 'tipo_equipamiento', count(*) from public.tipo_equipamiento
union all
select 'ubicacion_equipamiento', count(*) from public.ubicacion_equipamiento
union all
select 'tipo_mantenimiento', count(*) from public.tipo_mantenimiento
order by catalogo;

\echo '== Validando columnas opcionales en tablas existentes del baseline =='

select table_name, column_name, data_type
from information_schema.columns
where table_schema = 'public'
  and (
    (table_name = 'entrenadores' and column_name = 'id_tipo_empleado') or
    (table_name = 'producto' and column_name = 'id_categoria_producto') or
    (table_name = 'equipamiento' and column_name in ('id_tipo_equipamiento', 'id_ubicacion_equipamiento')) or
    (table_name = 'mantenimiento' and column_name = 'id_tipo_mantenimiento') or
    (table_name = 'pago' and column_name = 'id_medio_pago') or
    (table_name = 'otros_gastos' and column_name = 'id_tipo_gasto')
  )
order by table_name, column_name;

\echo '== Validando constraints defensivas creadas solo si existe la tabla =='

select conname, conrelid::regclass as tabla
from pg_constraint
where conname in (
  'entrenadores_id_tipo_empleado_fkey',
  'producto_id_categoria_producto_fkey',
  'equipamiento_id_tipo_equipamiento_fkey',
  'equipamiento_id_ubicacion_equipamiento_fkey',
  'mantenimiento_id_tipo_mantenimiento_fkey',
  'pago_id_medio_pago_fkey',
  'otros_gastos_id_tipo_gasto_fkey'
)
order by conname;

\echo '== Validación final OK si las 8 tablas aparecen con seeds y no hubo errores SQL =='
