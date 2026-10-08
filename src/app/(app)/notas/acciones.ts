"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { volverCon } from "@/lib/acciones";
import { leerNota } from "@/lib/notas";
import { requerirUsuario } from "@/lib/sesion";

// Guarda de una vez las notas del plan de evaluación de una materia.
// Llegan como campos "nota_<id de la evaluación>"; vacío borra la nota.
export async function guardarNotas(formulario: FormData) {
  const materiaId = z.string().uuid().parse(formulario.get("materia_id"));
  const ruta = `/materias/${materiaId}`;

  const cambios: { id: string; nota: number | null }[] = [];
  for (const [clave, valor] of formulario.entries()) {
    if (!clave.startsWith("nota_") || typeof valor !== "string") continue;
    const id = clave.slice(5);
    if (!z.string().uuid().safeParse(id).success) continue;
    const nota = leerNota(valor);
    if (nota === undefined) {
      volverCon(ruta, "error", `"${valor}" no es una nota válida. Usa de 0,0 a 5,0 con un decimal.`);
    }
    cambios.push({ id, nota });
  }

  const { supabase } = await requerirUsuario();
  const resultados = await Promise.all(
    cambios.map((c) => supabase.from("evaluaciones").update({ nota: c.nota }).eq("id", c.id).eq("materia_id", materiaId)),
  );
  if (resultados.some((r) => r.error)) volverCon(ruta, "error", "No se pudieron guardar las notas.");

  revalidatePath("/", "layout");
  volverCon(ruta, "ok", "Notas guardadas.");
}
