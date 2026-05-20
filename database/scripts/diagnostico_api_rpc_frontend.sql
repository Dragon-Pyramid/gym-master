-- Diagnóstico API/RPC/Frontend — Gym Master
-- Uso: ejecutar en Supabase SQL Editor o PostgreSQL para revisar funciones clave de BI/RPC.
-- Este script no modifica datos.

-- 1) Funciones públicas relacionadas con BI, rutinas, dieta, ficha médica y perfil
select
  n.nspname as schema_name,
  p.proname as function_name,
  pg_get_function_arguments(p.oid) as arguments,
  pg_get_function_result(p.oid) as returns
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in (
    'sp_concurrencia_semanal',
    'sp_concurrencia_mensual',
    'sp_concurrencia_anual',
    'sp_resumen_asistencias_por_periodo',
    'sp_prediccion_abandono',
    'sp_top_inactivos',
    'sp_adherencia_mensual_rutinas',
    'sp_evolucion_promedio_por_objetivo',
    'calcular_retencion_por_combinacion',
    'generar_rutina_socio',
    'sp_generar_rutina_personalizada',
    'genera_dieta_socio',
    'sp_analisis_conducta_pagos',
    'sp_estado_equipamiento_semaforo',
    'sp_ranking_fallos_equipamiento',
    'sp_analisis_costo_beneficio',
    'insert_ficha_medica',
    'get_ficha_medica_actual',
    'list_fichas_medicas',
    'log_profile_photo_updated',
    'tiene_foto'
  )
order by p.proname;

-- 2) Funciones esperadas por el código que podrían faltar
with expected(function_name) as (
  values
    ('sp_prediccion_abandono'),
    ('sp_top_inactivos'),
    ('sp_proyeccion_ingresos'),
    ('sp_prediccion_fallo_equipamiento')
)
select
  e.function_name,
  case when p.oid is null then 'missing' else 'exists' end as status
from expected e
left join pg_proc p on p.proname = e.function_name
left join pg_namespace n on n.oid = p.pronamespace and n.nspname = 'public'
order by e.function_name;

-- 3) RLS/policies de tablas usadas por módulos analíticos
select
  t.schemaname,
  t.tablename,
  t.rowsecurity,
  count(pol.policyname) as policies_count
from pg_tables t
left join pg_policies pol
  on pol.schemaname = t.schemaname
 and pol.tablename = t.tablename
where t.schemaname = 'public'
  and t.tablename in (
    'usuario',
    'socio',
    'asistencia',
    'rutina',
    'dieta',
    'evolucion_socio',
    'ficha_medica',
    'pago',
    'cuota',
    'equipamiento',
    'mantenimiento'
  )
group by t.schemaname, t.tablename, t.rowsecurity
order by t.tablename;

-- 4) Conteo base por tablas clave para saber si las métricas tendrán datos
select 'usuario' as tabla, count(*) as total from public.usuario
union all select 'socio', count(*) from public.socio
union all select 'asistencia', count(*) from public.asistencia
union all select 'rutina', count(*) from public.rutina
union all select 'dieta', count(*) from public.dieta
union all select 'evolucion_socio', count(*) from public.evolucion_socio
union all select 'ficha_medica', count(*) from public.ficha_medica
union all select 'pago', count(*) from public.pago
union all select 'cuota', count(*) from public.cuota
union all select 'equipamiento', count(*) from public.equipamiento
union all select 'mantenimiento', count(*) from public.mantenimiento;
