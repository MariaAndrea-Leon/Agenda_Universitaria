"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { datosDe, primerError, volverCon } from "@/lib/acciones";
import { sumaPorcentajes } from "@/lib/pendientes";
import { requerirUsuario, zonaDelUsuario } from "@/lib/sesion";
import { localAInstante } from "@/lib/zona";

const RUTA = "/evaluaciones";

const esquema = z.object({
  materia_id: z.string({ message: "Elige la materia." }).uuid("Elige la materia."),
  nombre: z.string({ message: "Escribe el nombre, por ejemplo Parcial 1." }).max(100, "El nombre es muy largo (máximo 100 caracteres)."),
  tipo: z.enum(["examen", "quiz", "taller", "exposicion", "proyecto", "otro"]).default("examen"),
  porcentaje: z.coerce
    .number({ message: "Escribe el porcentaje que vale." })
    .gt(0, "El porcentaje debe ser mayor que 0.")
    .max(100, "El porcentaje no puede pasar de 100."),
  fecha: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, "Fecha no válida.")
    .optional(),
  salon: z.string().max(40).optional(),
  temas: z.string().max(2000).optional(),
});

export async function crearEvaluacion(formulario: FormData) {
  const datos = datosDe(formulario);
  const { materia_id, nombre, tipo, porcentaje, fecha, salon, temas } = datos;
  const conservar = { materia_id, nombre, tipo, porcentaje, fecha, salon, temas };
  const entrada = esquema.safeParse(datos);
  if (!entrada.success) volverCon(RUTA, "error", primerError(entrada.error), conservar);

  const { supabase, usuario } = await requerirUsuario();

  // Los porcentajes de una materia no pueden pasar de 100 %.
  const { data: existentes } = await supabase
    .from("evaluaciones")
    .select("porcentaje")
    .eq("materia_id", entrada.data.materia_id);
  const usado = sumaPorcentajes(existentes ?? []);
  if (usado + entrada.data.porcentaje > 100.001) {
    volverCon(
      RUTA,
      "error",
      `Esa materia ya tiene ${usado} % asignado; solo quedan ${Math.max(0, 100 - usado)} %.`,
      conservar,
    );
  }

  const zona = await zonaDelUsuario(supabase, usuario.id);
  const { error } = await supabase.from("evaluaciones").insert({
    ...entrada.data,
    fecha: entrada.data.fecha ? localAInstante(entrada.data.fecha, zona).toISOString() : null,
    salon: entrada.data.salon ?? null,
    temas: entrada.data.temas ?? null,
  });
  if (error) volverCon(RUTA, "error", "No se pudo guardar la evaluación.", conservar);

  revalidatePath("/", "layout");
  volverCon(RUTA, "ok", "Evaluación agregada.");
}

export async function eliminarEvaluacion(formulario: FormData) {
  const id = z.string().uuid().parse(formulario.get("id"));
  const { supabase } = await requerirUsuario();
  await supabase.from("evaluaciones").delete().eq("id", id);
  revalidatePath("/", "layout");
  volverCon(RUTA, "ok", "Evaluación eliminada.");
}
