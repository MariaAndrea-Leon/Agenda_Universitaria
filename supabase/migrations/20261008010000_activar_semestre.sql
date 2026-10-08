-- Marca un semestre como activo y desactiva los demás del mismo usuario en
-- una sola transacción (el índice semestres_un_activo exige uno solo).
-- security invoker: corre con los permisos del usuario, así que RLS aplica.
create function public.activar_semestre(semestre uuid)
returns void
language sql
security invoker
set search_path = ''
as $$
  update public.semestres set activo = false where usuario_id = auth.uid() and activo and id <> semestre;
  update public.semestres set activo = true where usuario_id = auth.uid() and id = semestre;
$$;
