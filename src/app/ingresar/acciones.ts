"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { guardarModoEnCookie, guardarTemaEnCookie } from "@/lib/tema-cookie";
import { esModo, esTemaId } from "@/lib/temas/temas";

export interface EstadoIngreso {
  error?: string;
  aviso?: string;
  // React vacía el formulario después de cada envío; se devuelven los datos
  // para no obligar a escribirlos otra vez.
  correo?: string;
  nombre?: string;
}

function lo(datos: FormData, campo: string) {
  const v = datos.get(campo);
  return typeof v === "string" ? v : undefined;
}

const credenciales = z.object({
  correo: z.string().trim().email("Escribe un correo válido."),
  clave: z.string().min(8, "La contraseña debe tener al menos 8 caracteres."),
});

function traducirError(mensaje: string): string {
  if (/invalid login credentials/i.test(mensaje)) return "Correo o contraseña incorrectos.";
  if (/email not confirmed/i.test(mensaje)) return "Primero confirma tu correo con el enlace que te enviamos.";
  if (/already registered/i.test(mensaje)) return "Ya existe una cuenta con ese correo. Inicia sesión.";
  if (/rate limit/i.test(mensaje)) return "Demasiados intentos. Espera un momento y vuelve a intentar.";
  return "No se pudo completar. Intenta de nuevo.";
}

export async function iniciarSesion(_: EstadoIngreso, datos: FormData): Promise<EstadoIngreso> {
  const previo = { correo: lo(datos, "correo") };
  const entrada = credenciales.safeParse(Object.fromEntries(datos));
  if (!entrada.success) return { ...previo, error: entrada.error.issues[0].message };

  const supabase = await crearClienteServidor();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: entrada.data.correo,
    password: entrada.data.clave,
  });
  if (error) return { ...previo, error: traducirError(error.message) };

  const { data: perfil } = await supabase.from("perfiles").select("tema, modo").eq("id", data.user.id).maybeSingle();
  if (esTemaId(perfil?.tema)) await guardarTemaEnCookie(perfil.tema);
  if (esModo(perfil?.modo)) await guardarModoEnCookie(perfil.modo);

  redirect("/horario");
}

const registro = credenciales.extend({
  nombre: z.string().trim().min(1, "Escribe tu nombre.").max(80),
});

export async function registrarse(_: EstadoIngreso, datos: FormData): Promise<EstadoIngreso> {
  const previo = { correo: lo(datos, "correo"), nombre: lo(datos, "nombre") };
  const entrada = registro.safeParse(Object.fromEntries(datos));
  if (!entrada.success) return { ...previo, error: entrada.error.issues[0].message };

  const origen = (await headers()).get("origin") ?? "";
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase.auth.signUp({
    email: entrada.data.correo,
    password: entrada.data.clave,
    options: {
      data: { nombre: entrada.data.nombre },
      emailRedirectTo: `${origen}/auth/confirmar`,
    },
  });
  if (error) return { ...previo, error: traducirError(error.message) };

  // Si el proyecto pide confirmar el correo, todavía no hay sesión.
  if (!data.session) {
    return { aviso: `Te enviamos un enlace a ${entrada.data.correo}. Ábrelo para activar tu cuenta.` };
  }
  redirect("/semestres");
}
