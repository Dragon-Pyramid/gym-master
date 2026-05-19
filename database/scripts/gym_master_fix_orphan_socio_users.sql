-- ============================================================
-- GYM MASTER - Fix temporal para usuarios socio sin perfil socio
-- Ejecutar solo para usuarios creados como rol socio que no tienen
-- fila vinculada en public.socio.usuario_id.
--
-- IMPORTANTE:
-- - Reemplazar el email en el WHERE por el email real del socio de prueba.
-- - Reemplazar el DNI temporal por el DNI real si lo tenés.
-- ============================================================

insert into public.socio (
  usuario_id,
  nombre_completo,
  dni,
  email,
  activo,
  fecha_alta
)
select
  u.id,
  u.nombre,
  'TEMP-' || left(replace(u.id::text, '-', ''), 12) as dni,
  u.email,
  true,
  current_date
from public.usuario u
where u.rol = 'socio'
  and u.email = 'REEMPLAZAR_EMAIL_SOCIO@gymmaster.com'
  and not exists (
    select 1
    from public.socio s
    where s.usuario_id = u.id
  );

-- Verificación:
select
  u.id as usuario_id,
  u.nombre,
  u.email,
  u.rol,
  s.id_socio,
  s.dni,
  s.nombre_completo
from public.usuario u
left join public.socio s on s.usuario_id = u.id
where u.email = 'REEMPLAZAR_EMAIL_SOCIO@gymmaster.com';
