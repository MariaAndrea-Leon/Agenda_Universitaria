import { redirect } from "next/navigation";
import { Boton } from "@/components/boton";
import { volverCon } from "@/lib/acciones";
import { FormEliminar } from "@/components/eliminar";
import { EditorPizarron } from "@/components/editor-pizarron";
import { Mensajes } from "@/components/mensajes";
import type { Apunte } from "@/lib/modelos";
import { leerDibujo } from "@/lib/pizarron";
import { requerirUsuario } from "@/lib/sesion";
import { compartirApunte, dejarDeCompartir, eliminarApunte } from "../../../apuntes";

export default async function PaginaApunte({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; apunte: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { id, apunte: apunteId } = await params;
  const { error, ok } = await searchParams;
  const { supabase, usuario } = await requerirUsuario();
  const { data } = await supabase
    .from("apuntes")
    .select("*, materias(nombre, color)")
    .eq("id", apunteId)
    .eq("materia_id", id)
    .maybeSingle();
  // Si se borró (o el enlace es viejo), vuelve a la materia en vez de un error 404.
  if (!data) volverCon(`/materias/${id}`, "error", "Ese apunte ya no existe.");
  // Un apunte que alguien compartió contigo se ve en Compartidos, sin editar.
  if (data.usuario_id !== usuario.id) redirect(`/compartidos/${apunteId}`);
  const apunte = data as Apunte & { materias: { nombre: string; color: string } };
  const { data: compartidos } = await supabase
    .from("apuntes_compartidos")
    .select("id, destinatario_correo")
    .eq("apunte_id", apunte.id)
    .order("creado_en");
  const ruta = `/materias/${id}/apuntes/${apunte.id}`;

  return (
    <>
      <h1 className="sr-only">Apunte de {apunte.materias.nombre}</h1>
      <Mensajes error={error} ok={ok} />
      <EditorPizarron apunte={apunte} dibujo={leerDibujo(apunte.dibujo)} materia={apunte.materias}>
        <section id="compartir" className="flex flex-col gap-3 rounded-2xl bg-superficie p-4 sm:p-6">
          <h2 className="text-lg font-semibold">Compartir este apunte</h2>
          <p className="text-sm">
            Escribe el correo de otra persona que use la agenda. Lo verá en su sección Compartidos, sin poder cambiarlo.
          </p>
          <form action={compartirApunte} className="flex flex-wrap items-end gap-3">
            <input type="hidden" name="id" value={apunte.id} />
            <input type="hidden" name="materia_id" value={id} />
            <label className="flex min-w-60 flex-1 flex-col gap-1 text-sm font-medium">
              Correo
              <input
                name="correo"
                type="email"
                required
                autoComplete="email"
                placeholder="companero@utp.edu.co"
                className="rounded-lg border border-texto/20 bg-fondo px-3 py-2 text-base font-normal outline-primario"
              />
            </label>
            <Boton type="submit">Compartir</Boton>
          </form>
          {(compartidos ?? []).length > 0 && (
            <ul className="flex flex-col gap-2 border-t border-texto/15 pt-3">
              {(compartidos ?? []).map((c) => (
                <li key={c.id} className="has-[[data-eliminando]]:hidden flex items-center gap-3 rounded-xl bg-fondo px-3 py-2">
                  <span className="min-w-0 flex-1 truncate text-sm">Compartido con {c.destinatario_correo}</span>
                  <FormEliminar
                    action={dejarDeCompartir}
                    campos={{ id: c.id, volver: ruta }}
                    pregunta={`¿Dejar de compartir este apunte con ${c.destinatario_correo}?`}
                    etiqueta="Dejar de compartir"
                    ariaLabel={`Dejar de compartir con ${c.destinatario_correo}`}
                    enlace
                  />
                </li>
              ))}
            </ul>
          )}
        </section>
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
