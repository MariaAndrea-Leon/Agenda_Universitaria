-- Pizarrón de cada materia: apuntes de clase escritos a mano o con teclado.
-- "dibujo" guarda los trazos y textos en coordenadas de una hoja de 1000
-- unidades de ancho (ver src/lib/pizarron.ts).
create table public.apuntes (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  materia_id uuid not null references public.materias (id) on delete cascade,
  fecha date not null default current_date,
  titulo text check (char_length(titulo) <= 120),
  fondo text not null default 'pizarra-cuadros',
  dibujo jsonb not null default '{"v": 1, "alto": 1400, "trazos": [], "textos": []}'
    check (jsonb_typeof(dibujo) = 'object' and octet_length(dibujo::text) <= 5000000),
  creado_en timestamptz not null default now(),
  editado_en timestamptz not null default now()
);

create index on public.apuntes (materia_id, fecha desc);

alter table public.apuntes enable row level security;
create policy "datos propios" on public.apuntes
  for all using (usuario_id = auth.uid()) with check (usuario_id = auth.uid());

grant select, insert, update, delete on public.apuntes to authenticated, service_role;
