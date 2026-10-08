"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { conDetalle, volverCon } from "@/lib/acciones";
import { FONDO_POR_DEFECTO } from "@/lib/pizarron";
import { requerirUsuario, zonaDelUsuario } from "@/lib/sesion";
import { diaEnZona } from "@/lib/zona";

// Abre un apunte nuevo en el pizarrón, con el mismo fondo del último.
export async function crearApunte(formulario: FormData) {
  const materiaId = z.string().uuid().parse(formulario.get("materia_id"));
  const ruta = `/materias/${materiaId}`;
  const { supabase, usuario } = await requerirUsuario();
  const [{ data: ultimo }, zona] = await Promise.all([
    supabase
      .from("apuntes")
      .select("fondo")
      .eq("materia_id", materiaId)
      .order("creado_en", { ascending: false })
      .limit(1)
      .maybeSingle(),
    zonaDelUsuario(supabase, usuario.id),
  ]);
  const { data, error } = await supabase
    .from("apuntes")
    .insert({ materia_id: materiaId, fondo: ultimo?.fondo ?? FONDO_POR_DEFECTO, fecha: diaEnZona(new Date(), zona) })
    .select("id")
    .single();
  if (error) volverCon(ruta, "error", conDetalle("No se pudo crear el apunte.", error));
  redirect(`${ruta}/apuntes/${data.id}`);
}

export async function eliminarApunte(formulario: FormData) {
  const id = z.string().uuid().parse(formulario.get("id"));
  const materiaId = z.string().uuid().parse(formulario.get("materia_id"));
  const ruta = `/materias/${materiaId}`;
  const { supabase } = await requerirUsuario();
  const { error } = await supabase.from("apuntes").delete().eq("id", id);
  if (error) volverCon(`${ruta}/apuntes/${id}`, "error", conDetalle("No se pudo borrar el apunte.", error));
  revalidatePath(ruta);
  volverCon(ruta, "ok", "Apunte borrado.");
}
