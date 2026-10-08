"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { datosDe, primerError, volverCon } from "@/lib/acciones";
import { choquesCon, DIAS, formatoHora } from "@/lib/horario/horario";
import { COLORES_MATERIA, type Bloque } from "@/lib/modelos";
import { requerirUsuario, semestreActivo } from "@/lib/sesion";

const esquemaMateria = z.object({
  nombre: z.string({ message: "Escribe el nombre de la materia." }).max(100),
  codigo: z.string().max(30).optional(),
  docente: z.string().max(100).optional(),
  creditos: z.coerce.number().int().min(0, "Créditos entre 0 y 20.").max(20, "Créditos entre 0 y 20.").optional(),
  color: z.enum(COLORES_MATERIA).default(COLORES_MATERIA[0]),
});

function filaMateria(datos: z.infer<typeof esquemaMateria>) {
  return {
    nombre: datos.nombre,
    codigo: datos.codigo ?? null,
    docente: datos.docente ?? null,
    creditos: datos.creditos ?? null,
    color: datos.color,
  };
}

export async function crearMateria(formulario: FormData) {
  const entrada = esquemaMateria.safeParse(datosDe(formulario));
  if (!entrada.success) volverCon("/materias", "error", primerError(entrada.error));

  const { supabase } = await requerirUsuario();
  const semestre = await semestreActivo(supabase);
  if (!semestre) volverCon("/semestres", "error", "Primero crea un semestre.");

  const { data, error } = await supabase
    .from("materias")
    .insert({ ...filaMateria(entrada.data), semestre_id: semestre.id })
    .select("id")
    .single();
  if (error) volverCon("/materias", "error", "No se pudo crear la materia.");

  revalidatePath("/", "layout");
  // A la página de la materia, para agregarle el horario de una vez.
  redirect(`/materias/${data.id}?ok=${encodeURIComponent("Materia creada. Ahora agrega su horario.")}`);
}

export async function editarMateria(formulario: FormData) {
  const id = z.string().uuid().parse(formulario.get("id"));
  const ruta = `/materias/${id}`;
  const entrada = esquemaMateria.safeParse(datosDe(formulario));
  if (!entrada.success) volverCon(ruta, "error", primerError(entrada.error));

  const { supabase } = await requerirUsuario();
  const { error } = await supabase.from("materias").update(filaMateria(entrada.data)).eq("id", id);
  if (error) volverCon(ruta, "error", "No se pudo guardar la materia.");

  revalidatePath("/", "layout");
  volverCon(ruta, "ok", "Materia guardada.");
}

export async function eliminarMateria(formulario: FormData) {
  const id = z.string().uuid().parse(formulario.get("id"));
  const { supabase } = await requerirUsuario();
  const { error } = await supabase.from("materias").delete().eq("id", id);
  if (error) volverCon(`/materias/${id}`, "error", "No se pudo eliminar la materia.");

  revalidatePath("/", "layout");
  volverCon("/materias", "ok", "Materia eliminada.");
}

const hora = z.string().regex(/^\d{2}:\d{2}$/, "Hora no válida.");

const esquemaBloque = z
  .object({
    dia_semana: z.coerce.number().int().min(1).max(7),
    hora_inicio: hora,
    hora_fin: hora,
    salon: z.string().max(40).optional(),
    tipo: z.enum(["clase", "laboratorio", "tutoria", "otro"]).default("clase"),
  })
  .refine((b) => b.hora_fin > b.hora_inicio, { message: "La hora de fin debe ser después de la de inicio." });

export async function agregarBloque(formulario: FormData) {
  const materiaId = z.string().uuid().parse(formulario.get("materia_id"));
  const ruta = `/materias/${materiaId}`;
  const datos = datosDe(formulario);
  const { dia_semana, hora_inicio, hora_fin, salon, tipo } = datos;
  const conservar = { dia_semana, hora_inicio, hora_fin, salon, tipo };
  const entrada = esquemaBloque.safeParse(datos);
  if (!entrada.success) volverCon(ruta, "error", primerError(entrada.error), conservar);

  const { supabase } = await requerirUsuario();

  // Choques con el resto del horario del mismo semestre.
  if (formulario.get("permitir_choque") !== "on") {
    const { data: materia } = await supabase.from("materias").select("semestre_id").eq("id", materiaId).single();
    const { data: existentes } = await supabase
      .from("bloques_horario")
      .select("*, materias!inner(nombre, semestre_id)")
      .eq("materias.semestre_id", materia?.semestre_id ?? "")
      .eq("dia_semana", entrada.data.dia_semana);
    const cruces = choquesCon(
      entrada.data,
      (existentes ?? []) as (Bloque & { materias: { nombre: string } })[],
    );
    if (cruces.length > 0) {
      const c = cruces[0];
      const dia = DIAS[c.dia_semana - 1].nombre.toLowerCase();
      volverCon(
        ruta,
        "error",
        `Se cruza con ${c.materias.nombre} (${dia} ${formatoHora(c.hora_inicio)} a ${formatoHora(c.hora_fin)}). ` +
          `Si es correcto, marca "Guardar aunque se cruce".`,
        conservar,
      );
    }
  }

  const { error } = await supabase.from("bloques_horario").insert({
    ...entrada.data,
    salon: entrada.data.salon ?? null,
    materia_id: materiaId,
  });
  if (error) volverCon(ruta, "error", "No se pudo agregar el horario.", conservar);

  revalidatePath("/", "layout");
  volverCon(ruta, "ok", "Horario agregado.");
}

export async function eliminarBloque(formulario: FormData) {
  const id = z.string().uuid().parse(formulario.get("id"));
  const materiaId = z.string().uuid().parse(formulario.get("materia_id"));
  const { supabase } = await requerirUsuario();
  await supabase.from("bloques_horario").delete().eq("id", id);
  revalidatePath("/", "layout");
  volverCon(`/materias/${materiaId}`, "ok", "Horario eliminado.");
}
