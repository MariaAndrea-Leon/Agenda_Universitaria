"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";
import { volverCon } from "@/lib/acciones";
import { enviarPush, pushConfigurado } from "@/lib/envios";
import { ANTICIPACIONES } from "@/lib/recordatorios";
import { requerirUsuario } from "@/lib/sesion";

const VALIDAS = ANTICIPACIONES.map((a) => a.minutos) as number[];

export async function guardarAvisos(formulario: FormData) {
  const antes = formulario
    .getAll("avisos_antes")
    .map(Number)
    .filter((m) => VALIDAS.includes(m));
  const { supabase, usuario } = await requerirUsuario();
  const { error } = await supabase
    .from("perfiles")
    .update({
      avisos_push: formulario.get("avisos_push") === "on",
      avisos_correo: formulario.get("avisos_correo") === "on",
      avisos_antes: antes,
    })
    .eq("id", usuario.id);
  if (error) volverCon("/perfil", "error", "No se pudieron guardar los recordatorios.");
  revalidatePath("/perfil");
  volverCon("/perfil", "ok", "Recordatorios guardados.");
}

const suscripcion = z.object({
  endpoint: z.string().url().startsWith("https://"),
  keys: z.object({ p256dh: z.string().min(10).max(200), auth: z.string().min(10).max(100) }),
});

// Guarda la suscripción push de este dispositivo. Devuelve un mensaje de
// error o null.
export async function guardarSuscripcion(datos: unknown): Promise<string | null> {
  const s = suscripcion.safeParse(datos);
  if (!s.success) return "El navegador entregó una suscripción no válida.";
  const { supabase } = await requerirUsuario();
  // Si el endpoint ya estaba (de esta misma cuenta), se reemplaza.
  await supabase.from("suscripciones_push").delete().eq("endpoint", s.data.endpoint);
  const { error } = await supabase
    .from("suscripciones_push")
    .insert({ endpoint: s.data.endpoint, p256dh: s.data.keys.p256dh, auth: s.data.keys.auth });
  return error ? "No se pudo activar en este dispositivo." : null;
}

export async function borrarSuscripcion(endpoint: string) {
  const { supabase } = await requerirUsuario();
  await supabase.from("suscripciones_push").delete().eq("endpoint", endpoint);
}

// Manda una notificación de prueba a los dispositivos del usuario.
export async function probarNotificacion(): Promise<string> {
  if (!pushConfigurado()) return "Las notificaciones todavía no están configuradas en el servidor.";
  const { supabase } = await requerirUsuario();
  const { data } = await supabase.from("suscripciones_push").select("endpoint, p256dh, auth");
  if (!data?.length) return "Este usuario no tiene dispositivos con notificaciones activas.";
  const h = await headers();
  const sitio = h.get("origin") ?? `https://${h.get("host")}`;
  let ok = 0;
  for (const s of data) {
    const r = await enviarPush(
      s,
      { titulo: "Así se verán tus recordatorios", cuerpo: "Agenda Universitaria", url: "/hoy" },
      sitio,
    );
    if (r === "ok") ok++;
    if (r === "vencida") await supabase.from("suscripciones_push").delete().eq("endpoint", s.endpoint);
  }
  return ok > 0 ? `Notificación enviada a ${ok} ${ok === 1 ? "dispositivo" : "dispositivos"}.` : "No se pudo enviar.";
}
