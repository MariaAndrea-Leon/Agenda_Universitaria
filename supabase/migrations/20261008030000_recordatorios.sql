-- Preferencias de recordatorios y registro de lo ya enviado.

alter table public.perfiles
  add column avisos_push boolean not null default true,
  add column avisos_correo boolean not null default false,
  -- Minutos de anticipación: por defecto 1 día y 1 hora antes.
  add column avisos_antes integer[] not null default '{1440,60}'
    check (avisos_antes <@ array[10080, 2880, 1440, 180, 60, 30]);

-- "recordatorios" guarda cada aviso enviado; este índice evita mandar dos
-- veces el mismo aviso por el mismo canal.
create unique index recordatorios_unicos
  on public.recordatorios (coalesce(tarea_id, evaluacion_id, bloque_id), canal, enviar_en);
