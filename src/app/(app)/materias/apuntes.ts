"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { conDetalle, volverCon } from "@/lib/acciones";
import { correoConfigurado, enviarCorreo, enviarPush, pushConfigurado } from "@/lib/envios";
import { FONDO_POR_DEFECTO } from "@/lib/pizarron";
import { crearClienteServicio } from "@/lib/supabase/servicio";
import { requerirUsuario, zonaDelUsuario } from "@/lib/sesion";
import { diaEnZona } from "@/lib/zona";

// Abre un apunte nuevo en el pizarrón, con el mismo fondo del último.
export async function crearApunte(formulario: FormData) {
  const materiaId = z.string().uuid().parse(formulario.get("materia_id"));
  const ruta = `/materias/${materiaId}`;
  const { supabase, usuario } = await requerirUsuario();
  const [{ data: ultimo }, zona] = await Promise.all([
    supabase
      .from("apuntes")
      .select("fondo")
      .eq("materia_id", materiaId)
      .order("creado_en", { ascending: false })
      .limit(1)
      .maybeSingle(),
    zonaDelUsuario(supabase, usuario.id),
  ]);
  const { data, error } = await supabase
    .from("apuntes")
    .insert({ materia_id: materiaId, fondo: ultimo?.fondo ?? FONDO_POR_DEFECTO, fecha: diaEnZona(new Date(), zona) })
    .select("id")
    .single();
  if (error) volverCon(ruta, "error", conDetalle("No se pudo crear el apunte.", error));
  redirect(`${ruta}/apuntes/${data.id}`);
}

export async function eliminarApunte(formulario: FormData) {
  const id = z.string().uuid().parse(formulario.get("id"));
  const materiaId = z.string().uuid().parse(formulario.get("materia_id"));
  const ruta = `/materias/${materiaId}`;
  const { supabase } = await requerirUsuario();
  const { error } = await supabase.from("apuntes").delete().eq("id", id);
  if (error) volverCon(`${ruta}/apuntes/${id}`, "error", conDetalle("No se pudo borrar el apunte.", error));
  revalidatePath(ruta);
  volverCon(ruta, "ok", "Apunte borrado.");
}

const RESULTADOS: Record<string, string> = {
  sin_permiso: "Solo puedes compartir tus propios apuntes.",
  no_registrado: "Ese correo no tiene cuenta en la agenda. Pídele que se registre y vuelve a intentarlo.",
  propio: "Ese es tu propio correo.",
};

// Avisa a quien recibe el apunte, por notificación y por correo si están
// configurados. Si falla, el apunte igual queda compartido.
async function avisarCompartido(destinatarioId: string, correo: string, de: string, titulo: string) {
  const h = await headers();
  const sitio = h.get("origin") ?? `https://${h.get("host")}`;
  const mensaje = { titulo: `${de} compartió un apunte contigo`, cuerpo: titulo, url: "/compartidos" };
  const servicio = crearClienteServicio();
  if (servicio && pushConfigurado()) {
    const { data } = await servicio.from("suscripciones_push").select("endpoint, p256dh, auth").eq("usuario_id", destinatarioId);
    await Promise.all((data ?? []).map((s) => enviarPush(s, mensaje, sitio)));
  }
  if (correoConfigurado()) await enviarCorreo(correo, mensaje, sitio);
}

export async function compartirApunte(formulario: FormData) {
  const id = z.string().uuid().parse(formulario.get("id"));
  const materiaId = z.string().uuid().parse(formulario.get("materia_id"));
  const ruta = `/materias/${materiaId}/apuntes/${id}`;
  const correo = z.string().trim().toLowerCase().email().safeParse(formulario.get("correo"));
  if (!correo.success) volverCon(ruta, "error", "Escribe un correo válido.");

  const { supabase, usuario } = await requerirUsuario();
  const { data: resultado, error } = await supabase.rpc("compartir_apunte", { apunte: id, correo: correo.data });
  if (error) volverCon(ruta, "error", conDetalle("No se pudo compartir el apunte.", error));
  if (resultado !== "ok") volverCon(ruta, "error", RESULTADOS[resultado] ?? "No se pudo compartir el apunte.");

  const [{ data: fila }, { data: apunte }, { data: perfil }] = await Promise.all([
    supabase.from("apuntes_compartidos").select("destinatario_id").eq("apunte_id", id).eq("destinatario_correo", correo.data).maybeSingle(),
    supabase.from("apuntes").select("titulo").eq("id", id).maybeSingle(),
    supabase.from("perfiles").select("nombre").eq("id", usuario.id).maybeSingle(),
  ]);
  if (fila) {
    await avisarCompartido(fila.destinatario_id, correo.data, perfil?.nombre || usuario.email || "Alguien", apunte?.titulo || "Apunte de clase").catch(
      () => {},
    );
  }
  revalidatePath(ruta);
  volverCon(ruta, "ok", `Apunte compartido con ${correo.data}.`);
}

// Quien compartió deja de compartir, o quien recibió lo quita de su lista.
export async function dejarDeCompartir(formulario: FormData) {
  const id = z.string().uuid().parse(formulario.get("id"));
  const volver = z.string().regex(/^\/[a-z]/).parse(formulario.get("volver"));
  const { supabase } = await requerirUsuario();
  const { error } = await supabase.from("apuntes_compartidos").delete().eq("id", id);
  if (error) volverCon(volver, "error", conDetalle("No se pudo quitar.", error));
  revalidatePath(volver);
  volverCon(volver, "ok", volver.startsWith("/compartidos") ? "Apunte quitado de tu lista." : "Dejaste de compartir el apunte.");
}
