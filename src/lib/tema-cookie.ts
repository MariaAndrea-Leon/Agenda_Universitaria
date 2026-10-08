import { cookies } from "next/headers";
import { COOKIE_MODO, COOKIE_TEMA } from "@/lib/temas/css";
import type { Modo, TemaId } from "@/lib/temas/temas";

const OPCIONES = { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" } as const;

export async function guardarTemaEnCookie(tema: TemaId) {
  (await cookies()).set(COOKIE_TEMA, tema, OPCIONES);
}

export async function guardarModoEnCookie(modo: Modo) {
  (await cookies()).set(COOKIE_MODO, modo, OPCIONES);
}
