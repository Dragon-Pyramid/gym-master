-- Gym Master - Auth login separado + permisos RBAC base
-- Fecha: 2026-05-24
-- Objetivo: permitir permisos de menú por usuario/socio sin afectar admins.

alter table if exists public.usuario
  add column if not exists permisos_menu jsonb;

comment on column public.usuario.permisos_menu is
  'Lista JSON de claves de menú habilitadas para usuarios internos o socios. NULL conserva permisos por defecto o acceso total para admin.';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'usuario_permisos_menu_json_array_chk'
      and conrelid = 'public.usuario'::regclass
  ) then
    alter table public.usuario
      add constraint usuario_permisos_menu_json_array_chk
      check (
        permisos_menu is null
        or jsonb_typeof(permisos_menu) = 'array'
      );
  end if;
end $$;

update public.usuario
set permisos_menu = null
where rol = 'admin'
  and permisos_menu is not null;
