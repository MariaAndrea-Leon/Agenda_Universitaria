import { NextResponse } from "next/server";
import { z } from "zod";
import { generarIcs, type EventoIcs } from "@/lib/ics";
import { TIPOS_EVALUACION } from "@/lib/modelos";
import { crearClienteServicio } from "@/lib/supabase/servicio";
import { diaSemana, sumarDias, ZONA_POR_DEFECTO } from "@/lib/zona";

export const dynamic = "force-dynamic";

const MINUTO = 60_000;

// Calendario del semestre activo en formato .ics. El enlace lleva el token
// privado del perfil (con o sin ".ics" al final); quien lo tenga ve los
// eventos, nada más.
export async function GET(_: Request, { params }: { params: Promise<{ token: string }> }) {
  const token = (await params).token.replace(/\.ics$/, "");
  if (!z.string().uuid().safeParse(token).success) return new NextResponse("No encontrado", { status: 404 });

  const supabase = crearClienteServicio();
  if (!supabase) return new NextResponse("Calendario no disponible", { status: 503 });

  const { data: perfil } = await supabase
    .from("perfiles")
    .select("id, nombre, zona_horaria")
    .eq("token_calendario", token)
    .maybeSingle();
  if (!perfil) return new NextResponse("No encontrado", { status: 404 });
  const zona = perfil.zona_horaria || ZONA_POR_DEFECTO;

  const { data: semestre } = await supabase
    .from("semestres")
    .select("id, nombre, inicio, fin")
    .eq("usuario_id", perfil.id)
    .eq("activo", true)
    .maybeSingle();

  const eventos: EventoIcs[] = [];
  if (semestre) {
    const MATERIA = "materia:materias!inner(nombre, semestre_id)";
    const [tareas, evaluaciones, bloques] = await Promise.all([
      supabase
        .from("tareas")
        .select(`id, titulo, descripcion, entrega, ${MATERIA}`)
        .eq("usuario_id", perfil.id)
        .eq("materia.semestre_id", semestre.id)
        .is("completada_en", null),
      supabase
        .from("evaluaciones")
        .select(`id, nombre, tipo, porcentaje, fecha, salon, temas, ${MATERIA}`)
        .eq("usuario_id", perfil.id)
        .eq("materia.semestre_id", semestre.id)
        .not("fecha", "is", null),
      supabase
        .from("bloques_horario")
        .select(`id, dia_semana, hora_inicio, hora_fin, salon, ${MATERIA}`)
        .eq("usuario_id", perfil.id)
        .eq("materia.semestre_id", semestre.id),
    ]);
    const materia = (m: unknown) => (m as { nombre: string }).nombre;

    for (const t of tareas.data ?? []) {
      const fin = new Date(t.entrega).getTime();
      eventos.push({
        uid: `tarea-${t.id}@agenda-universitaria`,
        titulo: `Entrega: ${t.titulo} (${materia(t.materia)})`,
        descripcion: t.descripcion ?? undefined,
        inicio: new Date(fin - 30 * MINUTO).toISOString(),
        fin: t.entrega,
      });
    }
    for (const e of evaluaciones.data ?? []) {
      const tipo = TIPOS_EVALUACION.find((x) => x.valor === e.tipo)?.nombre ?? "Evaluación";
      eventos.push({
        uid: `evaluacion-${e.id}@agenda-universitaria`,
        titulo: `${tipo}: ${e.nombre} (${materia(e.materia)})`,
        lugar: e.salon ?? undefined,
        descripcion: [`Vale ${Number(e.porcentaje)} %`, e.temas && `Temas: ${e.temas}`].filter(Boolean).join("\n"),
        inicio: e.fecha!,
        fin: new Date(new Date(e.fecha!).getTime() + 120 * MINUTO).toISOString(),
      });
    }
    for (const b of bloques.data ?? []) {
      const primerDia = sumarDias(semestre.inicio, (b.dia_semana - diaSemana(semestre.inicio) + 7) % 7);
      if (primerDia > semestre.fin) continue;
      eventos.push({
        uid: `clase-${b.id}@agenda-universitaria`,
        titulo: materia(b.materia),
        lugar: b.salon ?? undefined,
        semanal: { primerDia, horaInicio: b.hora_inicio, horaFin: b.hora_fin, hasta: semestre.fin },
      });
    }
  }

  const nombre = semestre ? `Agenda ${semestre.nombre}` : "Agenda Universitaria";
  return new NextResponse(generarIcs(nombre, zona, eventos), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'inline; filename="agenda.ics"',
      "Cache-Control": "private, max-age=300",
    },
  });
}
