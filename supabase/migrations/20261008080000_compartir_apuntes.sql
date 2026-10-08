-- Compartir apuntes del pizarrón con otra persona que usa la app, por su
-- correo. Quien recibe solo puede ver el apunte (no editarlo).
create table public.apuntes_compartidos (
  id uuid primary key default gen_random_uuid(),
  apunte_id uuid not null references public.apuntes (id) on delete cascade,
  propietario_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  destinatario_id uuid not null references auth.users (id) on delete cascade,
  destinatario_correo text not null,
  propietario_nombre text,
  propietario_correo text,
  materia_nombre text not null,
  creado_en timestamptz not null default now(),
  unique (apunte_id, destinatario_id)
);

create index on public.apuntes_compartidos (destinatario_id, creado_en desc);

alter table public.apuntes_compartidos enable row level security;
create policy "propios o recibidos" on public.apuntes_compartidos
  for select using (propietario_id = auth.uid() or destinatario_id = auth.uid());
create policy "quitar propios o recibidos" on public.apuntes_compartidos
  for delete using (propietario_id = auth.uid() or destinatario_id = auth.uid());
grant select, delete on public.apuntes_compartidos to authenticated;
grant select, insert, update, delete on public.apuntes_compartidos to service_role;

-- Quien recibe un apunte puede leerlo.
create policy "compartidos conmigo" on public.apuntes
  for select using (
    exists (
      select 1 from public.apuntes_compartidos c
      where c.apunte_id = apuntes.id and c.destinatario_id = auth.uid()
    )
  );

-- Busca a la otra persona por su correo y comparte el apunte. Corre con
-- permisos elevados solo para leer auth.users; antes comprueba que el
-- apunte sea de quien lo comparte.
-- Devuelve: ok, sin_permiso, no_registrado o propio.
create function public.compartir_apunte(apunte uuid, correo text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  destino uuid;
  materia text;
  nombre text;
  mi_correo text;
begin
  select m.nombre into materia
  from public.apuntes a join public.materias m on m.id = a.materia_id
  where a.id = apunte and a.usuario_id = auth.uid();
  if materia is null then
    return 'sin_permiso';
  end if;

  select u.id into destino from auth.users u where lower(u.email) = lower(trim(correo));
  if destino is null then
    return 'no_registrado';
  end if;
  if destino = auth.uid() then
    return 'propio';
  end if;

  select p.nombre into nombre from public.perfiles p where p.id = auth.uid();
  select u.email into mi_correo from auth.users u where u.id = auth.uid();

  insert into public.apuntes_compartidos
    (apunte_id, propietario_id, destinatario_id, destinatario_correo, propietario_nombre, propietario_correo, materia_nombre)
  values (apunte, auth.uid(), destino, lower(trim(correo)), nombre, mi_correo, materia)
  on conflict (apunte_id, destinatario_id) do nothing;
  return 'ok';
end;
$$;

revoke execute on function public.compartir_apunte(uuid, text) from public, anon;
grant execute on function public.compartir_apunte(uuid, text) to authenticated;
