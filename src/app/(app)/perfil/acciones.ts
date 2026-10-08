"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { datosDe, primerError, conDetalle, volverCon } from "@/lib/acciones";
import { leerNota } from "@/lib/notas";
import { requerirUsuario } from "@/lib/sesion";
import { guardarModoEnCookie, guardarTemaEnCookie } from "@/lib/tema-cookie";

const esquema = z.object({
  nombre: z.string().max(80).optional(),
  universidad: z.string().max(120).optional(),
  carrera: z.string().max(120).optional(),
  tema: z.enum(["atardecer", "tierra"], { message: "Elige un tema." }),
  modo: z.enum(["claro", "oscuro", "sistema"], { message: "Elige un modo." }),
  nota_aprobatoria: z
    .string()
    .optional()
    .transform((t, ctx) => {
      const n = leerNota(t);
      if (n === undefined) {
        ctx.addIssue({ code: "custom", message: "La nota para aprobar va de 0,0 a 5,0 con un decimal." });
        return z.NEVER;
      }
      return n ?? 3;
    }),
});

export async function guardarPerfil(formulario: FormData) {
  const entrada = esquema.safeParse(datosDe(formulario));
  if (!entrada.success) volverCon("/perfil", "error", primerError(entrada.error));

  const { supabase, usuario } = await requerirUsuario();
  const { nombre, universidad, carrera, tema, modo, nota_aprobatoria } = entrada.data;
  const { error } = await supabase
    .from("perfiles")
    .update({ nombre: nombre ?? null, universidad: universidad ?? null, carrera: carrera ?? null, tema, modo, nota_aprobatoria })
    .eq("id", usuario.id);
  if (error) volverCon("/perfil", "error", conDetalle("No se pudo guardar el perfil.", error));

  await guardarTemaEnCookie(tema);
  await guardarModoEnCookie(modo);
  revalidatePath("/", "layout");
  volverCon("/perfil", "ok", "Perfil guardado.");
}

// Cambia el enlace privado del calendario; el anterior deja de funcionar.
export async function cambiarEnlaceCalendario() {
  const { supabase, usuario } = await requerirUsuario();
  const { error } = await supabase
    .from("perfiles")
    .update({ token_calendario: crypto.randomUUID() })
    .eq("id", usuario.id);
  if (error) volverCon("/perfil", "error", conDetalle("No se pudo cambiar el enlace.", error));
  revalidatePath("/perfil");
  volverCon("/perfil", "ok", "Enlace del calendario cambiado. El anterior ya no funciona.");
}

// Quita un equipo del historial (no desinstala la app de ese equipo).
export async function quitarEquipo(formulario: FormData) {
  const id = z.string().uuid().parse(formulario.get("id"));
  const { supabase } = await requerirUsuario();
  const { error } = await supabase.from("dispositivos").delete().eq("id", id);
  if (error) volverCon("/perfil", "error", conDetalle("No se pudo quitar el equipo.", error));
  revalidatePath("/perfil");
  volverCon("/perfil", "ok", "Equipo quitado del historial.");
}
