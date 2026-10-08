import { createClient } from "@supabase/supabase-js";

// Cliente con la clave service_role: salta RLS. Solo para tareas del
// servidor (recordatorios y avisos de apuntes compartidos). Nunca en el
// navegador ni en código que responda con datos a un usuario.
export function crearClienteServicio() {
  const clave = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!clave) return null;
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, clave, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
