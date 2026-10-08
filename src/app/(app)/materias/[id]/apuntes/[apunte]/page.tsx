import { volverCon } from "@/lib/acciones";
import { FormEliminar } from "@/components/eliminar";
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
  // Si se borró (o el enlace es viejo), vuelve a la materia en vez de un error 404.
  if (!data) volverCon(`/materias/${id}`, "error", "Ese apunte ya no existe.");
  const apunte = data as Apunte & { materias: { nombre: string; color: string } };

  return (
    <>
      <h1 className="sr-only">Apunte de {apunte.materias.nombre}</h1>
      <Mensajes error={error} />
      <EditorPizarron apunte={apunte} dibujo={leerDibujo(apunte.dibujo)} materia={apunte.materias}>
        <FormEliminar
          action={eliminarApunte}
          campos={{ id: apunte.id, materia_id: id }}
          pregunta="¿Seguro que quieres borrar este apunte completo? No se puede deshacer."
          etiqueta="Borrar este apunte"
          className="self-start"
        />
      </EditorPizarron>
    </>
  );
}
