import type { Bloque, Evaluacion, MateriaCorta, Tarea } from "@/lib/modelos";
import type { crearClienteServidor } from "@/lib/supabase/servidor";

type Cliente = Awaited<ReturnType<typeof crearClienteServidor>>;

export type TareaConMateria = Tarea & { materia: MateriaCorta };
export type EvaluacionConMateria = Evaluacion & { materia: MateriaCorta };
export type BloqueConMateria = Bloque & { materia: MateriaCorta };

const MATERIA = "materia:materias!inner(id, nombre, color, semestre_id)";

export async function materiasDelSemestre(supabase: Cliente, semestreId: string) {
  const { data } = await supabase
    .from("materias")
    .select("id, nombre, color")
    .eq("semestre_id", semestreId)
    .order("nombre");
  return (data ?? []) as MateriaCorta[];
}

export async function tareasDelSemestre(supabase: Cliente, semestreId: string) {
  const { data } = await supabase
    .from("tareas")
    .select(`*, ${MATERIA}`)
    .eq("materia.semestre_id", semestreId)
    .order("entrega");
  return (data ?? []) as TareaConMateria[];
}

export async function evaluacionesDelSemestre(supabase: Cliente, semestreId: string) {
  const { data } = await supabase
    .from("evaluaciones")
    .select(`*, ${MATERIA}`)
    .eq("materia.semestre_id", semestreId)
    .order("fecha", { nullsFirst: false });
  return (data ?? []) as EvaluacionConMateria[];
}

export async function bloquesDelSemestre(supabase: Cliente, semestreId: string) {
  const { data } = await supabase
    .from("bloques_horario")
    .select(`*, ${MATERIA}`)
    .eq("materia.semestre_id", semestreId)
    .order("hora_inicio");
  return (data ?? []) as BloqueConMateria[];
}
