import { NextResponse, type NextRequest } from "next/server";
import { correoConfigurado, enviarCorreo, enviarPush, pushConfigurado, type SuscripcionPush } from "@/lib/envios";
import { avisosPorEnviar, mensajeDe, VENTANA_MINUTOS, type Aviso, type Pendiente } from "@/lib/recordatorios";
import { crearClienteServicio } from "@/lib/supabase/servicio";

export const dynamic = "force-dynamic";

// Programador de recordatorios. Lo llama GitHub Actions cada 15 minutos con
// "Authorization: Bearer <CRON_SECRET>".
export async function GET(peticion: NextRequest) {
  const secreto = process.env.CRON_SECRET;
  if (!secreto || peticion.headers.get("authorization") !== `Bearer ${secreto}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const supabase = crearClienteServicio();
  if (!supabase) return NextResponse.json({ error: "Falta SUPABASE_SERVICE_ROLE_KEY" }, { status: 503 });

  const ahora = new Date();
  const sitio = new URL(peticion.url).origin;
  const desde = ahora.toISOString();
  const hasta = new Date(ahora.getTime() + (7 * 1440 + VENTANA_MINUTOS) * 60_000).toISOString();

  const [tareas, evaluaciones, perfiles] = await Promise.all([
    supabase
      .from("tareas")
      .select("id, usuario_id, titulo, entrega, materia:materias(nombre)")
      .is("completada_en", null)
      .gt("entrega", desde)
      .lte("entrega", hasta),
    supabase
      .from("evaluaciones")
      .select("id, usuario_id, nombre, fecha, materia:materias(nombre)")
      .gt("fecha", desde)
      .lte("fecha", hasta),
    supabase.from("perfiles").select("id, avisos_push, avisos_correo, avisos_antes"),
  ]);
  if (tareas.error || evaluaciones.error || perfiles.error) {
    return NextResponse.json({ error: "No se pudieron leer los pendientes" }, { status: 500 });
  }

  const nombreMateria = (m: unknown) => (m as { nombre?: string } | null)?.nombre ?? "";
  const pendientes: Pendiente[] = [
    ...tareas.data.map((t) => ({
      tipo: "tarea" as const,
      id: t.id,
      usuarioId: t.usuario_id,
      titulo: t.titulo,
      materia: nombreMateria(t.materia),
      cuando: t.entrega,
    })),
    ...evaluaciones.data.map((e) => ({
      tipo: "evaluacion" as const,
      id: e.id,
      usuarioId: e.usuario_id,
      titulo: e.nombre,
      materia: nombreMateria(e.materia),
      cuando: e.fecha!,
    })),
  ];

  const resultado = { avisos: 0, push: 0, correos: 0, errores: 0 };
  const usarPush = pushConfigurado();
  const usarCorreo = correoConfigurado();

  for (const perfil of perfiles.data) {
    const canales = [
      ...(perfil.avisos_push && usarPush ? (["push"] as const) : []),
      ...(perfil.avisos_correo && usarCorreo ? (["correo"] as const) : []),
    ];
    if (canales.length === 0) continue;
    const avisos = avisosPorEnviar(
      pendientes.filter((p) => p.usuarioId === perfil.id),
      perfil.avisos_antes ?? [],
      ahora,
    );
    if (avisos.length === 0) continue;
    resultado.avisos += avisos.length;

    let suscripciones: SuscripcionPush[] = [];
    let correo: string | undefined;
    if (canales.includes("push")) {
      const { data } = await supabase.from("suscripciones_push").select("endpoint, p256dh, auth").eq("usuario_id", perfil.id);
      suscripciones = data ?? [];
    }
    if (canales.includes("correo")) {
      const { data } = await supabase.auth.admin.getUserById(perfil.id);
      correo = data.user?.email;
    }

    for (const aviso of avisos) {
      for (const canal of canales) {
        // Primero se registra; si ya existía, otra pasada lo envió.
        if (!(await registrar(supabase, aviso, canal))) continue;
        const mensaje = mensajeDe(aviso);
        if (canal === "push") {
          for (const s of suscripciones) {
            const r = await enviarPush(s, mensaje, sitio);
            if (r === "ok") resultado.push++;
            else if (r === "vencida") await supabase.from("suscripciones_push").delete().eq("endpoint", s.endpoint);
            else resultado.errores++;
          }
        } else if (correo) {
          if ((await enviarCorreo(correo, mensaje, sitio)) === "ok") resultado.correos++;
          else resultado.errores++;
        }
      }
    }
  }

  return NextResponse.json(resultado);
}

async function registrar(
  supabase: NonNullable<ReturnType<typeof crearClienteServicio>>,
  aviso: Aviso,
  canal: "push" | "correo",
): Promise<boolean> {
  const { error } = await supabase.from("recordatorios").insert({
    usuario_id: aviso.usuarioId,
    tarea_id: aviso.tipo === "tarea" ? aviso.id : null,
    evaluacion_id: aviso.tipo === "evaluacion" ? aviso.id : null,
    enviar_en: aviso.enviarEn,
    canal,
    enviado_en: new Date().toISOString(),
  });
  return !error;
}
