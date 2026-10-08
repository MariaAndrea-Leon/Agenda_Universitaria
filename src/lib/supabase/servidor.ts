import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Cliente de Supabase para componentes de servidor, acciones y rutas.
// La sesión del usuario viaja en cookies.
export async function crearClienteServidor() {
  const almacen = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return almacen.getAll();
        },
        setAll(lista) {
          try {
            lista.forEach(({ name, value, options }) => almacen.set(name, value, options));
          } catch {
            // Llamado desde un componente de servidor: el middleware de la
            // fase 1 se encarga de refrescar la sesión.
          }
        },
      },
    },
  );
}
