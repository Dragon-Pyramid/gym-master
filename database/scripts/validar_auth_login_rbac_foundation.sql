\echo '== Validando columna permisos_menu en usuario =='
select column_name, data_type, is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name = 'usuario'
  and column_name = 'permisos_menu';

\echo '== Validando constraint de permisos_menu =='
select conname
from pg_constraint
where conname = 'usuario_permisos_menu_json_array_chk';

\echo '== Validando JSON array permitido en transacción de prueba =='
begin;

update public.usuario
set permisos_menu = '["Inicio","Socios","Pagos"]'::jsonb
where rol in ('usuario', 'socio')
  and id = (
    select id
    from public.usuario
    where rol in ('usuario', 'socio')
    limit 1
  );

select id, rol, permisos_menu
from public.usuario
where permisos_menu is not null
limit 5;

rollback;

\echo '== Validación final OK si la columna y constraint aparecen sin errores SQL =='
