import { cookies } from "next/headers";
import { COOKIE_TEMA } from "@/lib/temas/css";
import type { TemaId } from "@/lib/temas/temas";

export async function guardarTemaEnCookie(tema: TemaId) {
  (await cookies()).set(COOKIE_TEMA, tema, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
}
