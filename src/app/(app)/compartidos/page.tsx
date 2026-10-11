import Link from "next/link";
import { DibujoSvg } from "@/components/dibujo-svg";
import { FormEliminar } from "@/components/eliminar";
import { Mensajes, type ParamsMensajes } from "@/components/mensajes";
import { conDetalle } from "@/lib/acciones";
import { COLUMNAS_COMPARTIDO, type Compartido, deQuien } from "@/lib/compartidos";
import { fondoDe, leerDibujo } from "@/lib/pizarron";
import { requerirUsuario } from "@/lib/sesion";
import { diaLargo } from "@/lib/zona";
import { dejarDeCompartir } from "../materias/apuntes";

// Apuntes que otras personas compartieron contigo.
export default async function PaginaCompartidos({ searchParams }: { searchParams: ParamsMensajes }) {
  const { supabase, usuario } = await requerirUsuario();
  const { data, error } = await supabase
    .from("apuntes_compartidos")
    .select(COLUMNAS_COMPARTIDO)
    .eq("destinatario_id", usuario.id)
    .order("creado_en", { ascending: false });
  const compartidos = ((data ?? []) as unknown as Compartido[]).filter((c) => c.apuntes);

  return (
    <>
      <h1 className="text-2xl font-bold">Compartidos conmigo</h1>
      <Mensajes {...await searchParams} />
      {error ? (
        <Mensajes error={conDetalle("No se pudieron cargar los apuntes compartidos.", error)} />
      ) : compartidos.length === 0 ? (
        <p className="rounded-2xl bg-superficie p-4 text-sm sm:p-6">
          Nadie te ha compartido apuntes todavía. Cuando alguien comparta uno con tu correo, aparece aquí.
        </p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {compartidos.map((c) => {
            const a = c.apuntes!;
            return (
              <li key={c.id} className="has-[[data-eliminando]]:hidden flex flex-col overflow-hidden rounded-2xl bg-superficie">
                <Link href={`/compartidos/${a.id}`} className="flex flex-col">
                  <DibujoSvg dibujo={leerDibujo(a.dibujo)} fondo={fondoDe(a.fondo)} alto={700} className="aspect-[10/7] w-full" />
                  <span className="px-4 pt-3">
                    <span className="block truncate font-semibold">{a.titulo || "Apunte de clase"}</span>
                    <span className="block text-sm">
                      {c.materia_nombre} · <span className="first-letter:uppercase">{diaLargo(a.fecha)}</span>
                    </span>
                    <span className="block truncate text-sm">De {deQuien(c)}</span>
                  </span>
                </Link>
                <FormEliminar
                  action={dejarDeCompartir}
                  campos={{ id: c.id, volver: "/compartidos" }}
                  pregunta="¿Quitar este apunte de tu lista? Quien lo compartió lo conserva."
                  etiqueta="Quitar de mi lista"
                  ariaLabel={`Quitar "${a.titulo || "Apunte de clase"}" de mi lista`}
                  enlace
                  className="px-4 pb-3 pt-2"
                />
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
