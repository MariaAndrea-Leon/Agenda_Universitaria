import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { FONDOS, validarDibujo } from "@/lib/pizarron";
import { crearClienteServidor } from "@/lib/supabase/servidor";

// Guarda un apunte del pizarrón. Va por el servidor (no directo del
// navegador a Supabase) para que use la misma sesión que las páginas y no
// se quede esperando la sesión del navegador.
const esquema = z.object({
  titulo: z.string().max(120),
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  fondo: z.enum(FONDOS.map((f) => f.id) as [string, ...string[]]),
  dibujo: z.unknown(),
});

const responder = (error: string, estado: number) => NextResponse.json({ error }, { status: estado });

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) return responder("Apunte no válido.", 400);

  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return responder("Tu sesión se cerró. Vuelve a ingresar; tus cambios quedan en este equipo.", 401);

  const datos = esquema.safeParse(await request.json().catch(() => null));
  const dibujo = datos.success ? validarDibujo(datos.data.dibujo) : null;
  if (!datos.success || !dibujo) return responder("El apunte llegó incompleto. Se vuelve a intentar.", 400);

  const { data, error } = await supabase
    .from("apuntes")
    .update({
      titulo: datos.data.titulo.trim() || null,
      fecha: datos.data.fecha,
      fondo: datos.data.fondo,
      dibujo,
      editado_en: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("usuario_id", user.id)
    .select("id");
  if (error) return responder(`Motivo: ${error.message.slice(0, 160)}`, 500);
  if (!data.length) return responder("Este apunte ya no existe o no es tuyo.", 404);
  return NextResponse.json({ ok: true });
}
