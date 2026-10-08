import { notFound } from "next/navigation";
import { Boton } from "@/components/boton";
import { EditorPizarron } from "@/components/editor-pizarron";
import { Mensajes } from "@/components/mensajes";
import type { Apunte } from "@/lib/modelos";
import { leerDibujo } from "@/lib/pizarron";
import { requerirUsuario } from "@/lib/sesion";
import { eliminarApunte } from "../../../apuntes";

export default async function PaginaApunte({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; apunte: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { id, apunte: apunteId } = await params;
  const { error } = await searchParams;
  const { supabase } = await requerirUsuario();
  const { data } = await supabase
    .from("apuntes")
    .select("*, materias(nombre, color)")
    .eq("id", apunteId)
    .eq("materia_id", id)
    .maybeSingle();
  if (!data) notFound();
  const apunte = data as Apunte & { materias: { nombre: string; color: string } };

  return (
    <>
      <h1 className="sr-only">Apunte de {apunte.materias.nombre}</h1>
      <Mensajes error={error} />
      <EditorPizarron apunte={apunte} dibujo={leerDibujo(apunte.dibujo)} materia={apunte.materias}>
        <details className="rounded-2xl bg-superficie p-4">
          <summary className="cursor-pointer text-sm font-medium">Borrar este apunte</summary>
          <form action={eliminarApunte} className="mt-3 flex flex-col gap-2">
            <input type="hidden" name="id" value={apunte.id} />
            <input type="hidden" name="materia_id" value={id} />
            <p className="text-sm">Se borra el apunte completo. No se puede deshacer.</p>
            <Boton variante="peligro" className="self-start">
              Sí, borrar el apunte
            </Boton>
          </form>
        </details>
      </EditorPizarron>
    </>
  );
}
