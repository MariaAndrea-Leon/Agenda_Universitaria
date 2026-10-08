-- Preferencia de modo claro / oscuro / según el dispositivo.
alter table public.perfiles
  add column modo text not null default 'sistema' check (modo in ('claro', 'oscuro', 'sistema'));
