import { NextResponse, type NextRequest } from "next/server";
import { RUTA_IMAGEN } from "@/lib/pizarron";
import { crearClienteServidor } from "@/lib/supabase/servidor";

// Entrega una imagen del pizarrón a quien puede verla (su dueño o alguien
// con quien se compartió el apunte; lo decide la política de Storage).
export async function GET(_: NextRequest, { params }: { params: Promise<{ ruta: string[] }> }) {
  const ruta = (await params).ruta.join("/");
  if (!RUTA_IMAGEN.test(ruta)) return new NextResponse(null, { status: 404 });

  const supabase = await crearClienteServidor();
  const { data, error } = await supabase.storage.from("apuntes").download(ruta);
  if (error || !data) return new NextResponse(null, { status: 404 });
  return new NextResponse(data, {
    headers: {
      "Content-Type": data.type || "image/webp",
      // Cada archivo tiene un nombre único y nunca cambia.
      "Cache-Control": "private, max-age=31536000, immutable",
    },
  });
}
