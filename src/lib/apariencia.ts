"use server";

import { revalidatePath } from "next/cache";
import { requerirUsuario } from "@/lib/sesion";
import { guardarModoEnCookie } from "@/lib/tema-cookie";
import { esModo } from "@/lib/temas/temas";

// Cambia el modo desde el botón de la barra, sin pasar por el perfil.
export async function cambiarModo(modo: string) {
  if (!esModo(modo)) return;
  const { supabase, usuario } = await requerirUsuario();
  await supabase.from("perfiles").update({ modo }).eq("id", usuario.id);
  await guardarModoEnCookie(modo);
  revalidatePath("/", "layout");
}
