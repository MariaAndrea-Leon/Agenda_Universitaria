-- Historial de equipos donde se instaló la app. "clave" es un identificador
-- aleatorio que cada equipo guarda para reconocerse.
create table public.dispositivos (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  clave uuid not null,
  nombre text not null check (char_length(nombre) <= 80),
  instalada_en timestamptz not null default now(),
  ultimo_uso timestamptz not null default now(),
  unique (usuario_id, clave)
);

alter table public.dispositivos enable row level security;
create policy "datos propios" on public.dispositivos
  for all using (usuario_id = auth.uid()) with check (usuario_id = auth.uid());

grant select, insert, update, delete on public.dispositivos to authenticated, service_role;
