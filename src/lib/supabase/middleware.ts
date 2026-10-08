import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Rutas que se pueden ver sin iniciar sesión.
const PUBLICAS = ["/", "/ingresar", "/auth"];

function esPublica(ruta: string) {
  return PUBLICAS.some((p) => ruta === p || (p !== "/" && ruta.startsWith(`${p}/`)));
}

// Refresca la sesión de Supabase en cada petición y manda a /ingresar a
// quien intente abrir una página privada sin sesión.
export async function actualizarSesion(request: NextRequest) {
  let respuesta = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(lista) {
          lista.forEach(({ name, value }) => request.cookies.set(name, value));
          respuesta = NextResponse.next({ request });
          lista.forEach(({ name, value, options }) => respuesta.cookies.set(name, value, options));
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && !esPublica(request.nextUrl.pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/ingresar";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return respuesta;
}
