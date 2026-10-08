-- Esquema inicial de la Agenda Universitaria.
-- Cada fila pertenece a un usuario (auth.users) y Row Level Security
-- garantiza que cada estudiante solo vea y modifique sus propios datos.

-- Perfil -------------------------------------------------------------------

create table public.perfiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nombre text,
  universidad text,
  carrera text,
  zona_horaria text not null default 'America/Bogota',
  tema text not null default 'atardecer' check (tema in ('atardecer', 'tierra')),
  nota_aprobatoria numeric(2, 1) not null default 3.0 check (nota_aprobatoria between 0 and 5),
  creado_en timestamptz not null default now()
);

-- Crea el perfil automáticamente al registrarse.
create function public.crear_perfil()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.perfiles (id, nombre)
  values (new.id, new.raw_user_meta_data ->> 'nombre');
  return new;
end;
$$;

create trigger al_registrar_usuario
  after insert on auth.users
  for each row execute function public.crear_perfil();

-- Estructura académica -----------------------------------------------------

create table public.semestres (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  nombre text not null,
  inicio date not null,
  fin date not null,
  activo boolean not null default false,
  creado_en timestamptz not null default now(),
  check (fin > inicio)
);

-- Solo un semestre activo por usuario.
create unique index semestres_un_activo on public.semestres (usuario_id) where activo;

create table public.materias (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  semestre_id uuid not null references public.semestres (id) on delete cascade,
  nombre text not null,
  codigo text,
  docente text,
  creditos smallint check (creditos between 0 and 20),
  color text not null default '#95122C' check (color ~ '^#[0-9A-Fa-f]{6}$'),
  creado_en timestamptz not null default now()
);

create table public.bloques_horario (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  materia_id uuid not null references public.materias (id) on delete cascade,
  -- 1 = lunes ... 7 = domingo (ISO 8601).
  dia_semana smallint not null check (dia_semana between 1 and 7),
  hora_inicio time not null,
  hora_fin time not null,
  salon text,
  tipo text not null default 'clase' check (tipo in ('clase', 'laboratorio', 'tutoria', 'otro')),
  check (hora_fin > hora_inicio)
);

-- Pendientes ---------------------------------------------------------------

create table public.tareas (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  materia_id uuid not null references public.materias (id) on delete cascade,
  titulo text not null,
  descripcion text,
  entrega timestamptz not null,
  prioridad text not null default 'media' check (prioridad in ('baja', 'media', 'alta')),
  completada_en timestamptz,
  creado_en timestamptz not null default now()
);

-- Exámenes, quices, talleres calificables... Cada evaluación tiene fecha
-- (para el calendario) y porcentaje y nota (para el promedio).
create table public.evaluaciones (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  materia_id uuid not null references public.materias (id) on delete cascade,
  nombre text not null,
  tipo text not null default 'examen'
    check (tipo in ('examen', 'quiz', 'taller', 'exposicion', 'proyecto', 'otro')),
  porcentaje numeric(5, 2) not null check (porcentaje > 0 and porcentaje <= 100),
  fecha timestamptz,
  salon text,
  temas text,
  nota numeric(2, 1) check (nota between 0 and 5),
  creado_en timestamptz not null default now()
);

-- Recordatorios ------------------------------------------------------------

create table public.recordatorios (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  tarea_id uuid references public.tareas (id) on delete cascade,
  evaluacion_id uuid references public.evaluaciones (id) on delete cascade,
  bloque_id uuid references public.bloques_horario (id) on delete cascade,
  enviar_en timestamptz not null,
  canal text not null default 'push' check (canal in ('push', 'correo')),
  enviado_en timestamptz,
  -- Cada recordatorio apunta exactamente a una cosa.
  check (num_nonnulls(tarea_id, evaluacion_id, bloque_id) = 1)
);

create index recordatorios_pendientes on public.recordatorios (enviar_en) where enviado_en is null;

create table public.suscripciones_push (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  creado_en timestamptz not null default now()
);

-- Índices por usuario y por materia ------------------------------------------

create index on public.semestres (usuario_id);
create index on public.materias (usuario_id, semestre_id);
create index on public.bloques_horario (materia_id);
create index on public.tareas (usuario_id, entrega);
create index on public.evaluaciones (materia_id);

-- Row Level Security -------------------------------------------------------

alter table public.perfiles enable row level security;
create policy "perfil propio" on public.perfiles
  for all using (id = auth.uid()) with check (id = auth.uid());

do $$
declare
  tabla text;
begin
  foreach tabla in array array[
    'semestres', 'materias', 'bloques_horario', 'tareas',
    'evaluaciones', 'recordatorios', 'suscripciones_push'
  ] loop
    execute format('alter table public.%I enable row level security', tabla);
    execute format(
      'create policy "datos propios" on public.%I for all '
      'using (usuario_id = auth.uid()) with check (usuario_id = auth.uid())',
      tabla
    );
  end loop;
end;
$$;
