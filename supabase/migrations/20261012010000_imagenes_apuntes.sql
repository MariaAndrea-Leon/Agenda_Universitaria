-- Imágenes del pizarrón en Supabase Storage (bucket privado "apuntes").
-- Cada archivo va en <usuario>/<apunte>/<archivo>. Quien es dueño sube,
-- ve y borra sus imágenes; quien recibe un apunte compartido solo las ve.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('apuntes', 'apuntes', false, 5242880, array['image/webp', 'image/jpeg', 'image/png'])
on conflict (id) do update
  set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "apuntes: subir las propias" on storage.objects;
create policy "apuntes: subir las propias" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'apuntes' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "apuntes: ver propias o compartidas" on storage.objects;
create policy "apuntes: ver propias o compartidas" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'apuntes' and (
      (storage.foldername(name))[1] = auth.uid()::text
      or exists (
        select 1 from public.apuntes_compartidos c
        where c.apunte_id::text = (storage.foldername(name))[2] and c.destinatario_id = auth.uid()
      )
    )
  );

drop policy if exists "apuntes: borrar las propias" on storage.objects;
create policy "apuntes: borrar las propias" on storage.objects
  for delete to authenticated
  using (bucket_id = 'apuntes' and (storage.foldername(name))[1] = auth.uid()::text);
