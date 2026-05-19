-- Gym Master - Diagnóstico de base de datos / DER / RLS / RPC
-- Objetivo: ejecutar en Supabase SQL Editor para validar el estado real sin modificar datos.

-- 1) Tablas públicas y RLS
select
  schemaname,
  tablename,
  rowsecurity
from pg_tables
where schemaname = 'public'
order by tablename;

-- 2) Policies vigentes
select
  schemaname,
  tablename,
  policyname,
  cmd,
  roles,
  qual,
  with_check
from pg_policies
where schemaname = 'public'
order by tablename, policyname;

-- 3) Policies demasiado abiertas para producción
select
  tablename,
  policyname,
  cmd,
  roles,
  qual,
  with_check
from pg_policies
where schemaname = 'public'
  and (
    coalesce(qual, '') in ('true', '(true)')
    or coalesce(with_check, '') in ('true', '(true)')
    or lower(policyname) like 'dev_%'
  )
order by tablename, policyname;

-- 4) Funciones/RPC públicas
select
  p.proname as function_name,
  pg_get_function_arguments(p.oid) as arguments,
  pg_get_function_result(p.oid) as returns,
  l.lanname as language,
  p.prosecdef as security_definer
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
join pg_language l on l.oid = p.prolang
where n.nspname = 'public'
order by p.proname;

-- 5) Verificar RPC que el código llama pero pueden faltar
select
  required_rpc,
  exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = required_rpc
  ) as exists_in_db
from (
  values
    ('sp_prediccion_abandono'),
    ('sp_top_inactivos'),
    ('sp_concurrencia_semanal'),
    ('sp_concurrencia_mensual'),
    ('sp_concurrencia_anual'),
    ('sp_analisis_conducta_pagos'),
    ('sp_estado_equipamiento_semaforo'),
    ('sp_ranking_fallos_equipamiento'),
    ('sp_analisis_costo_beneficio'),
    ('sp_adherencia_mensual_rutinas'),
    ('sp_evolucion_promedio_por_objetivo'),
    ('calcular_retencion_por_combinacion'),
    ('generar_rutina_socio'),
    ('genera_dieta_socio'),
    ('insert_ficha_medica'),
    ('get_ficha_medica_actual'),
    ('list_fichas_medicas')
) as x(required_rpc)
order by required_rpc;

-- 6) Relaciones FK
select
  tc.table_name as source_table,
  kcu.column_name as source_column,
  ccu.table_name as target_table,
  ccu.column_name as target_column,
  tc.constraint_name
from information_schema.table_constraints tc
join information_schema.key_column_usage kcu
  on tc.constraint_name = kcu.constraint_name
 and tc.table_schema = kcu.table_schema
join information_schema.constraint_column_usage ccu
  on ccu.constraint_name = tc.constraint_name
 and ccu.table_schema = tc.table_schema
where tc.constraint_type = 'FOREIGN KEY'
  and tc.table_schema = 'public'
order by source_table, source_column;

-- 7) Revisión específica: tablas similares de horarios de entrenadores
select 'entrenador_horarios' as table_name, count(*) as rows_count from public.entrenador_horarios
union all
select 'horario_entrenador' as table_name, count(*) as rows_count from public.horario_entrenador;

-- 8) Revisión específica: columnas JSON esperadas en dietas y rutinas
select table_name, column_name, data_type, udt_name
from information_schema.columns
where table_schema = 'public'
  and table_name in ('dieta', 'rutina')
order by table_name, ordinal_position;

-- 9) Revisión específica: posible relación circular de ventas
select
  tc.table_name as source_table,
  kcu.column_name as source_column,
  ccu.table_name as target_table,
  ccu.column_name as target_column,
  tc.constraint_name
from information_schema.table_constraints tc
join information_schema.key_column_usage kcu
  on tc.constraint_name = kcu.constraint_name
 and tc.table_schema = kcu.table_schema
join information_schema.constraint_column_usage ccu
  on ccu.constraint_name = tc.constraint_name
 and ccu.table_schema = tc.table_schema
where tc.constraint_type = 'FOREIGN KEY'
  and tc.table_schema = 'public'
  and tc.table_name in ('venta', 'venta_detalle')
order by source_table, source_column;
