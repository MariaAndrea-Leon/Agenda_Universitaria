import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { crearClienteServidor } from "@/lib/supabase/servidor";

// Sube una imagen para un apunte propio. El navegador ya la achicó; aquí
// solo se revisa el tipo y el tamaño.
const TIPOS: Record<string, string> = { "image/webp": "webp", "image/jpeg": "jpg", "image/png": "png" };
const MAXIMO = 4 * 1024 * 1024;

const responder = (error: string, estado: number) => NextResponse.json({ error }, { status: estado });

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) return responder("Apunte no válido.", 400);

  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return responder("Tu sesión se cerró. Vuelve a ingresar.", 401);

  const { data: apunte } = await supabase.from("apuntes").select("id").eq("id", id).eq("usuario_id", user.id).maybeSingle();
  if (!apunte) return responder("Este apunte ya no existe o no es tuyo.", 404);

  const archivo = (await request.formData().catch(() => null))?.get("imagen");
  if (!(archivo instanceof File)) return responder("No llegó la imagen.", 400);
  const extension = TIPOS[archivo.type];
  if (!extension) return responder("Solo se pueden poner imágenes JPG, PNG o WebP.", 400);
  if (archivo.size > MAXIMO) return responder("La imagen pesa demasiado (máximo 4 MB).", 400);

  const ruta = `${user.id}/${id}/${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage.from("apuntes").upload(ruta, archivo, { contentType: archivo.type });
  if (error) return responder(`No se pudo subir la imagen. Motivo: ${error.message.slice(0, 160)}`, 500);
  return NextResponse.json({ ruta });
}
