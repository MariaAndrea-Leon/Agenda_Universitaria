-- Apuntes largos escritos a mano: el tope de 5 MB se quedaba corto (unas
-- 4 hojas llenas). Se sube a 20 MB; el pizarrón llega a 10 hojas.
alter table public.apuntes drop constraint if exists apuntes_dibujo_check;
alter table public.apuntes add constraint apuntes_dibujo_check
  check (jsonb_typeof(dibujo) = 'object' and octet_length(dibujo::text) <= 20000000);
