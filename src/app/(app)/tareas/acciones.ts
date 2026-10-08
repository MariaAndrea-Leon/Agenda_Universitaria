"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { datosDe, primerError, volverCon } from "@/lib/acciones";
import { requerirUsuario, zonaDelUsuario } from "@/lib/sesion";
import { localAInstante } from "@/lib/zona";

const esquema = z.object({
  materia_id: z.string({ message: "Elige la materia." }).uuid("Elige la materia."),
  titulo: z.string({ message: "Escribe qué hay que entregar." }).max(150, "El título es muy largo (máximo 150 caracteres)."),
  entrega: z
    .string({ message: "Elige la fecha de entrega." })
    .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, "Fecha de entrega no válida."),
  prioridad: z.enum(["baja", "media", "alta"]).default("media"),
  descripcion: z.string().max(2000).optional(),
});

// Las acciones vuelven a la página desde donde se llamaron (Hoy, Tareas o
// la materia), que llega en el campo oculto "volver".
function rutaDeVuelta(formulario: FormData) {
  const v = formulario.get("volver");
  return typeof v === "string" && /^\/[a-z]/.test(v) ? v : "/tareas";
}

export async function crearTarea(formulario: FormData) {
  const ruta = rutaDeVuelta(formulario);
  const datos = datosDe(formulario);
  const entrada = esquema.safeParse(datos);
  const { materia_id, titulo, entrega, prioridad, descripcion } = datos;
  const conservar = { materia_id, titulo, entrega, prioridad, descripcion };
  if (!entrada.success) volverCon(ruta, "error", primerError(entrada.error), conservar);

  const { supabase, usuario } = await requerirUsuario();
  const zona = await zonaDelUsuario(supabase, usuario.id);
  const { error } = await supabase.from("tareas").insert({
    ...entrada.data,
    descripcion: entrada.data.descripcion ?? null,
    entrega: localAInstante(entrada.data.entrega, zona).toISOString(),
  });
  if (error) volverCon(ruta, "error", "No se pudo guardar la tarea.", conservar);

  revalidatePath("/", "layout");
  volverCon(ruta, "ok", "Tarea agregada.");
}

export async function alternarTarea(formulario: FormData) {
  const id = z.string().uuid().parse(formulario.get("id"));
  const hecha = formulario.get("hecha") === "1";
  const { supabase } = await requerirUsuario();
  await supabase
    .from("tareas")
    .update({ completada_en: hecha ? null : new Date().toISOString() })
    .eq("id", id);
  revalidatePath("/", "layout");
}

export async function eliminarTarea(formulario: FormData) {
  const id = z.string().uuid().parse(formulario.get("id"));
  const { supabase } = await requerirUsuario();
  await supabase.from("tareas").delete().eq("id", id);
  revalidatePath("/", "layout");
  volverCon(rutaDeVuelta(formulario), "ok", "Tarea eliminada.");
}
