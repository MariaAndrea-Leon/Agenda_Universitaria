import { redirect } from "next/navigation";
import type { ZodError } from "zod";

// Las acciones de formulario redirigen a la misma página con ?error= u ?ok=
// para que el mensaje se vea sin JavaScript.
// `conservar` vuelve a poner en la URL lo que se escribió, para que el
// formulario no se vacíe cuando hay un error.
export function volverCon(
  ruta: string,
  tipo: "error" | "ok",
  mensaje: string,
  conservar: Record<string, string | undefined> = {},
): never {
  const params = new URLSearchParams({ [tipo]: mensaje });
  for (const [k, v] of Object.entries(conservar)) if (v) params.set(k, v);
  redirect(`${ruta}?${params}`);
}

export function primerError(error: ZodError): string {
  return error.issues[0]?.message ?? "Revisa los datos del formulario.";
}

// Convierte "" en undefined para que los campos opcionales vacíos no fallen.
export function datosDe(formulario: FormData): Record<string, string | undefined> {
  return Object.fromEntries(
    [...formulario.entries()].map(([k, v]) => [k, typeof v === "string" && v.trim() !== "" ? v.trim() : undefined]),
  );
}
