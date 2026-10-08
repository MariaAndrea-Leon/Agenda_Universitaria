-- Enlace privado para suscribirse a la agenda desde Google Calendar u otro
-- calendario. Quien tenga el enlace puede ver los eventos, por eso es un
-- valor aleatorio que el estudiante puede cambiar desde su perfil.
alter table public.perfiles
  add column token_calendario uuid not null default gen_random_uuid() unique;
