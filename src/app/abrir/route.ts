import { NextResponse, type NextRequest } from "next/server";

// Llega aquí cuando el botón "Abrir la app" usa el enlace web+agenda://.
// Solo se aceptan rutas internas de la agenda.
export function GET(request: NextRequest) {
  const destino = request.nextUrl.searchParams.get("destino") ?? "";
  const ruta = destino.replace(/^web\+agenda:\/*/, "/");
  const segura = /^\/[a-z][a-z0-9/-]*$/.test(ruta) ? ruta : "/hoy";
  return NextResponse.redirect(new URL(segura, request.url));
}
