import Link from "next/link";
import { Boton } from "@/components/boton";
import { CamposMateria } from "@/components/campos-materia";
import { Mensajes, type ParamsMensajes } from "@/components/mensajes";
import { DIAS, formatoHora } from "@/lib/horario/horario";
import { COLORES_MATERIA, type Bloque, type Materia } from "@/lib/modelos";
import { requerirUsuario, semestreActivo } from "@/lib/sesion";
import { crearMateria } from "./acciones";

type MateriaConBloques = Materia & { bloques_horario: Bloque[] };

export default async function PaginaMaterias({ searchParams }: { searchParams: ParamsMensajes }) {
  const { supabase } = await requerirUsuario();
  const semestre = await semestreActivo(supabase);

  if (!semestre) {
    return (
      <>
        <h1 className="text-2xl font-bold">Materias</h1>
        <p className="rounded-2xl bg-superficie p-4">
          Necesitas un semestre activo para agregar materias.{" "}
          <Link href="/semestres" className="font-medium underline">
            Crear semestre
          </Link>
        </p>
      </>
    );
  }

  const { data } = await supabase
    .from("materias")
    .select("*, bloques_horario(*)")
    .eq("semestre_id", semestre.id)
    .order("nombre");
  const materias = (data ?? []) as MateriaConBloques[];
  const creditos = materias.reduce((suma, m) => suma + (m.creditos ?? 0), 0);

  return (
    <>
      <div>
        <h1 className="text-2xl font-bold">Materias</h1>
        <p className="text-sm opacity-80">
          {semestre.nombre} · {materias.length} {materias.length === 1 ? "materia" : "materias"} · {creditos} créditos
        </p>
      </div>
      <Mensajes {...await searchParams} />

      {materias.length > 0 && (
        <ul className="grid gap-3 sm:grid-cols-2">
          {materias.map((m) => (
            <li key={m.id}>
              <Link
                href={`/materias/${m.id}`}
                className="flex h-full gap-3 rounded-2xl bg-superficie p-4 hover:outline-2 hover:outline-primario"
              >
                <span className="w-1.5 shrink-0 rounded-full" style={{ backgroundColor: m.color }} aria-hidden />
                <span className="flex flex-col gap-1">
                  <span className="font-semibold">{m.nombre}</span>
                  <span className="text-sm opacity-80">
                    {[m.docente, m.creditos != null && `${m.creditos} créditos`].filter(Boolean).join(" · ") ||
                      "Sin docente"}
                  </span>
                  <span className="text-sm">
                    {m.bloques_horario.length === 0
                      ? "Sin horario"
                      : [...m.bloques_horario]
                          .sort((a, b) => a.dia_semana - b.dia_semana || a.hora_inicio.localeCompare(b.hora_inicio))
                          .map((b) => `${DIAS[b.dia_semana - 1].corto} ${formatoHora(b.hora_inicio)}`)
                          .join(", ")}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <form action={crearMateria} className="flex flex-col gap-4 rounded-2xl bg-superficie p-4 sm:p-6">
        <h2 className="text-lg font-semibold">Nueva materia</h2>
        <CamposMateria colorSugerido={COLORES_MATERIA[materias.length % COLORES_MATERIA.length]} />
        <Boton type="submit" className="self-start">
          Crear materia
        </Boton>
      </form>
    </>
  );
}
