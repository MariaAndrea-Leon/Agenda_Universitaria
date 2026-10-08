-- Permisos explícitos para la API de Supabase. Algunos proyectos nuevos no
-- dan acceso automático a las tablas creadas por SQL; sin esto, leer y
-- guardar falla para todos aunque el inicio de sesión funcione.
-- RLS sigue decidiendo qué filas ve cada estudiante.
grant usage on schema public to anon, authenticated, service_role;
grant select, insert, update, delete on all tables in schema public to authenticated, service_role;
grant usage, select on all sequences in schema public to authenticated, service_role;
grant execute on all functions in schema public to authenticated, service_role;

alter default privileges in schema public
  grant select, insert, update, delete on tables to authenticated, service_role;
alter default privileges in schema public
  grant usage, select on sequences to authenticated, service_role;
alter default privileges in schema public
  grant execute on functions to authenticated, service_role;

-- Perfiles de cuentas creadas antes de que existiera el disparador.
insert into public.perfiles (id, nombre)
select u.id, u.raw_user_meta_data ->> 'nombre'
from auth.users u
on conflict (id) do nothing;
