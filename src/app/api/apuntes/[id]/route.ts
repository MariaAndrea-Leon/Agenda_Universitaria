import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { FONDOS, validarDibujo } from "@/lib/pizarron";
import { crearClienteServidor } from "@/lib/supabase/servidor";

// Guarda un apunte del pizarrón. Va por el servidor (no directo del
// navegador a Supabase) para que use la misma sesión que las páginas y no
// se quede esperando la sesión del navegador.
//
// Lo pueden editar quien lo creó y quien lo recibió compartido. Cada
// guardado dice qué revisión tenía abierta la persona; si otra persona
// guardó antes, gana la primera y se responde 409 con la versión actual.
const esquema = z.object({
  titulo: z.string().max(120),
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  fondo: z.enum(FONDOS.map((f) => f.id) as [string, ...string[]]),
  dibujo: z.unknown(),
  revision: z.number().int().min(1),
});

const responder = (error: string, estado: number, extra?: object) =>
  NextResponse.json({ error, ...extra }, { status: estado });

const SIN_SESION = "Tu sesión se cerró. Vuelve a ingresar; tus cambios quedan en este equipo.";
const SIN_PERMISO = "Este apunte ya no existe o ya no está compartido contigo.";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) return responder("Apunte no válido.", 400);

  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return responder(SIN_SESION, 401);

  const datos = esquema.safeParse(await request.json().catch(() => null));
  const dibujo = datos.success ? validarDibujo(datos.data.dibujo) : null;
  if (!datos.success || !dibujo) return responder("El apunte llegó incompleto. Se vuelve a intentar.", 400);

  const { data, error } = await supabase.rpc("guardar_apunte", {
    apunte: id,
    revision_base: datos.data.revision,
    nuevo_titulo: datos.data.titulo.trim() || null,
    nueva_fecha: datos.data.fecha,
    nuevo_fondo: datos.data.fondo,
    nuevo_dibujo: dibujo,
  });
  // Si la base todavía no tiene la función (falta correr el SQL), guarda
  // como antes: solo quien creó el apunte.
  if (error?.code === "PGRST202") {
    const { titulo, fecha, fondo } = datos.data;
    const viejo = await supabase
      .from("apuntes")
      .update({ titulo: titulo.trim() || null, fecha, fondo, dibujo, editado_en: new Date().toISOString() })
      .eq("id", id)
      .eq("usuario_id", user.id)
      .select("id");
    if (viejo.error) return responder(`Motivo: ${viejo.error.message.slice(0, 160)}`, 500);
    if (!viejo.data.length) return responder(SIN_PERMISO, 404);
    return NextResponse.json({ ok: true });
  }
  if (error) return responder(`Motivo: ${error.message.slice(0, 160)}`, 500);
  const r = data as { estado: string; revision?: number; editado_por?: string | null };
  if (r.estado === "ok") return NextResponse.json({ ok: true, revision: r.revision });
  if (r.estado === "conflicto") {
    const quien = r.editado_por || "Otra persona";
    return responder(`${quien} guardó cambios en este apunte antes que tú.`, 409, { actual: r });
  }
  if (r.estado === "sin_sesion") return responder(SIN_SESION, 401);
  return responder(SIN_PERMISO, 404);
}

// Devuelve la versión guardada si es distinta de la que se tiene abierta
// (?revision=N). Así cada persona ve lo que la otra va guardando.
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) return responder("Apunte no válido.", 400);
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return responder(SIN_SESION, 401);

  const conocida = Number(request.nextUrl.searchParams.get("revision"));
  const { data: fila, error } = await supabase.from("apuntes").select("revision").eq("id", id).maybeSingle();
  if (error) return responder(`Motivo: ${error.message.slice(0, 160)}`, 500);
  if (!fila) return responder(SIN_PERMISO, 404);
  if (fila.revision === conocida) return new NextResponse(null, { status: 204, headers: { "Cache-Control": "no-store" } });

  const { data: actual } = await supabase
    .from("apuntes")
    .select("revision, titulo, fecha, fondo, dibujo, editado_en, editado_por_nombre")
    .eq("id", id)
    .maybeSingle();
  if (!actual) return responder(SIN_PERMISO, 404);
  return NextResponse.json(
    { actual: { ...actual, editado_por: actual.editado_por_nombre } },
    { headers: { "Cache-Control": "no-store" } },
  );
}
