"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { datosDe, primerError, volverCon } from "@/lib/acciones";
import { requerirUsuario } from "@/lib/sesion";
import { guardarModoEnCookie, guardarTemaEnCookie } from "@/lib/tema-cookie";

const esquema = z.object({
  nombre: z.string().max(80).optional(),
  universidad: z.string().max(120).optional(),
  carrera: z.string().max(120).optional(),
  tema: z.enum(["atardecer", "tierra"], { message: "Elige un tema." }),
  modo: z.enum(["claro", "oscuro", "sistema"], { message: "Elige un modo." }),
});

export async function guardarPerfil(formulario: FormData) {
  const entrada = esquema.safeParse(datosDe(formulario));
  if (!entrada.success) volverCon("/perfil", "error", primerError(entrada.error));

  const { supabase, usuario } = await requerirUsuario();
  const { nombre, universidad, carrera, tema, modo } = entrada.data;
  const { error } = await supabase
    .from("perfiles")
    .update({ nombre: nombre ?? null, universidad: universidad ?? null, carrera: carrera ?? null, tema, modo })
    .eq("id", usuario.id);
  if (error) volverCon("/perfil", "error", "No se pudo guardar el perfil.");

  await guardarTemaEnCookie(tema);
  await guardarModoEnCookie(modo);
  revalidatePath("/", "layout");
  volverCon("/perfil", "ok", "Perfil guardado.");
}
