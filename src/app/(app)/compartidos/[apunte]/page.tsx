import { EditorPizarron } from "@/components/editor-pizarron";
import { conDetalle, volverCon } from "@/lib/acciones";
import { COLUMNAS_COMPARTIDO, type Compartido, deQuien } from "@/lib/compartidos";
import type { Apunte } from "@/lib/modelos";
import { leerDibujo } from "@/lib/pizarron";
import { requerirUsuario } from "@/lib/sesion";

// Un apunte compartido contigo: lo pueden editar quien lo compartió y tú.
// Si los dos guardan al mismo tiempo, queda lo que se guardó primero.
export default async function PaginaApunteCompartido({ params }: { params: Promise<{ apunte: string }> }) {
  const { apunte: id } = await params;
  const { supabase, usuario } = await requerirUsuario();
  const { data, error } = await supabase
    .from("apuntes_compartidos")
    .select(COLUMNAS_COMPARTIDO)
    .eq("destinatario_id", usuario.id)
    .eq("apunte_id", id)
    .maybeSingle();
  if (error) volverCon("/compartidos", "error", conDetalle("No se pudo abrir el apunte.", error));
  const c = data as unknown as Compartido | null;
  if (!c?.apuntes) volverCon("/compartidos", "error", "Ese apunte ya no está compartido contigo.");
  const a = c.apuntes as Apunte;

  return (
    <>
      <h1 className="sr-only">Apunte de {c.materia_nombre}, compartido por {deQuien(c)}</h1>
      <EditorPizarron
        apunte={a}
        dibujo={leerDibujo(a.dibujo)}
        materia={{ nombre: c.materia_nombre, color: "transparent" }}
        volver={{ href: "/compartidos", nombre: "Compartidos conmigo" }}
        compartido
      >
        <p className="text-sm">
          De {deQuien(c)} · {c.materia_nombre}. Los cambios que hagas los ve también quien lo compartió.
        </p>
      </EditorPizarron>
    </>
  );
}
