"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { datosDe, primerError, volverCon } from "@/lib/acciones";
import { requerirUsuario } from "@/lib/sesion";

const RUTA = "/semestres";

const esquema = z
  .object({
    nombre: z.string({ message: "Escribe el nombre del semestre." }).max(60),
    inicio: z.string({ message: "Elige la fecha de inicio." }).date("Fecha de inicio no válida."),
    fin: z.string({ message: "Elige la fecha de fin." }).date("Fecha de fin no válida."),
  })
  .refine((s) => s.fin > s.inicio, { message: "La fecha de fin debe ser después del inicio." });

export async function crearSemestre(formulario: FormData) {
  const entrada = esquema.safeParse(datosDe(formulario));
  if (!entrada.success) volverCon(RUTA, "error", primerError(entrada.error));

  const { supabase } = await requerirUsuario();
  const { count } = await supabase.from("semestres").select("id", { count: "exact", head: true });
  const { data, error } = await supabase.from("semestres").insert(entrada.data).select("id").single();
  if (error) volverCon(RUTA, "error", "No se pudo crear el semestre.");

  // El primer semestre, o uno marcado así, queda como activo.
  if (count === 0 || formulario.get("activar") === "on") {
    await supabase.rpc("activar_semestre", { semestre: data.id });
  }
  revalidatePath("/", "layout");
  volverCon(RUTA, "ok", "Semestre creado.");
}

export async function activarSemestre(formulario: FormData) {
  const id = z.string().uuid().parse(formulario.get("id"));
  const { supabase } = await requerirUsuario();
  const { error } = await supabase.rpc("activar_semestre", { semestre: id });
  if (error) volverCon(RUTA, "error", "No se pudo activar el semestre.");
  revalidatePath("/", "layout");
  volverCon(RUTA, "ok", "Semestre activo cambiado.");
}

export async function eliminarSemestre(formulario: FormData) {
  const id = z.string().uuid().parse(formulario.get("id"));
  const { supabase } = await requerirUsuario();
  const { error } = await supabase.from("semestres").delete().eq("id", id);
  if (error) volverCon(RUTA, "error", "No se pudo eliminar el semestre.");
  revalidatePath("/", "layout");
  volverCon(RUTA, "ok", "Semestre eliminado con sus materias.");
}
