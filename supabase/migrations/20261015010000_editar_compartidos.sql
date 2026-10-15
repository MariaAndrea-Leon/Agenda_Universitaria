-- Apuntes compartidos que se pueden editar entre las dos personas.
-- Cada guardado trae la revisión que la persona tenía abierta. Si mientras
-- tanto otra persona guardó, gana quien guardó primero: el guardado nuevo se
-- rechaza y se le devuelve la versión actual para que la cargue.
alter table public.apuntes add column if not exists revision integer not null default 1;
alter table public.apuntes add column if not exists editado_por_nombre text;

-- Cualquier cambio sube la revisión, también los que no pasan por la función.
create or replace function public.subir_revision_apunte()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.revision is not distinct from old.revision then
    new.revision := old.revision + 1;
  end if;
  return new;
end;
$$;

drop trigger if exists subir_revision on public.apuntes;
create trigger subir_revision before update on public.apuntes
  for each row execute function public.subir_revision_apunte();

-- Guarda un apunte propio o compartido contigo.
-- Devuelve {estado: ok | conflicto | sin_permiso | sin_sesion, ...}.
create or replace function public.guardar_apunte(
  apunte uuid,
  revision_base integer,
  nuevo_titulo text,
  nueva_fecha date,
  nuevo_fondo text,
  nuevo_dibujo jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  fila public.apuntes;
  nombre text;
begin
  if auth.uid() is null then
    return jsonb_build_object('estado', 'sin_sesion');
  end if;

  select a.* into fila
  from public.apuntes a
  where a.id = apunte
    and (
      a.usuario_id = auth.uid()
      or exists (
        select 1 from public.apuntes_compartidos c
        where c.apunte_id = a.id and c.destinatario_id = auth.uid()
      )
    )
  for update;
  if not found then
    return jsonb_build_object('estado', 'sin_permiso');
  end if;

  if fila.revision <> revision_base then
    return jsonb_build_object(
      'estado', 'conflicto',
      'revision', fila.revision,
      'titulo', fila.titulo,
      'fecha', fila.fecha,
      'fondo', fila.fondo,
      'dibujo', fila.dibujo,
      'editado_en', fila.editado_en,
      'editado_por', fila.editado_por_nombre
    );
  end if;

  select coalesce(nullif(trim(p.nombre), ''), u.email) into nombre
  from auth.users u left join public.perfiles p on p.id = u.id
  where u.id = auth.uid();

  update public.apuntes
  set titulo = nuevo_titulo,
      fecha = nueva_fecha,
      fondo = nuevo_fondo,
      dibujo = nuevo_dibujo,
      editado_en = now(),
      editado_por_nombre = nombre,
      revision = fila.revision + 1
  where id = apunte;

  return jsonb_build_object('estado', 'ok', 'revision', fila.revision + 1);
end;
$$;

revoke execute on function public.guardar_apunte(uuid, integer, text, date, text, jsonb) from public, anon;
grant execute on function public.guardar_apunte(uuid, integer, text, date, text, jsonb) to authenticated;

-- Imágenes: quien recibe el apunte también puede ponerle imágenes (van en
-- su propia carpeta), y las dos personas ven todas las imágenes del apunte.
drop policy if exists "apuntes: ver propias o compartidas" on storage.objects;
create policy "apuntes: ver propias o compartidas" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'apuntes' and (
      (storage.foldername(name))[1] = auth.uid()::text
      or exists (
        select 1 from public.apuntes a
        where a.id::text = (storage.foldername(name))[2]
          and (
            a.usuario_id = auth.uid()
            or exists (
              select 1 from public.apuntes_compartidos c
              where c.apunte_id = a.id and c.destinatario_id = auth.uid()
            )
          )
      )
    )
  );

notify pgrst, 'reload schema';
