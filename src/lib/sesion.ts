import { redirect } from "next/navigation";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { ZONA_POR_DEFECTO } from "@/lib/zona";

// Cliente de Supabase y usuario actual para páginas y acciones privadas.
// El middleware ya redirige sin sesión; esto es la segunda barrera.
export async function requerirUsuario() {
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/ingresar");
  return { supabase, usuario: user };
}

export async function semestreActivo(supabase: Awaited<ReturnType<typeof crearClienteServidor>>) {
  const { data } = await supabase.from("semestres").select("*").eq("activo", true).maybeSingle();
  return data as import("@/lib/modelos").Semestre | null;
}

// Zona horaria del perfil, para interpretar fechas y saber qué día es "hoy".
export async function zonaDelUsuario(
  supabase: Awaited<ReturnType<typeof crearClienteServidor>>,
  usuarioId: string,
): Promise<string> {
  const { data } = await supabase.from("perfiles").select("zona_horaria").eq("id", usuarioId).maybeSingle();
  return data?.zona_horaria || ZONA_POR_DEFECTO;
}
