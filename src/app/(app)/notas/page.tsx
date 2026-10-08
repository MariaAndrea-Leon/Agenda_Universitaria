import Link from "next/link";
import { Mensajes, type ParamsMensajes } from "@/components/mensajes";
import { frasePara, tonoDe } from "@/components/notas";
import { SinMaterias, SinSemestre } from "@/components/sin-semestre";
import type { Evaluacion, Materia } from "@/lib/modelos";
import { formatoNota, promedioSemestre, resumenMateria } from "@/lib/notas";
import { notaAprobatoria, requerirUsuario, semestreActivo } from "@/lib/sesion";

type MateriaConNotas = Pick<Materia, "id" | "nombre" | "color" | "creditos"> & {
  evaluaciones: Pick<Evaluacion, "porcentaje" | "nota">[];
};

export default async function PaginaNotas({ searchParams }: { searchParams: ParamsMensajes }) {
  const { supabase, usuario } = await requerirUsuario();
  const semestre = await semestreActivo(supabase);
  if (!semestre) return <SinSemestre titulo="Notas" />;

  const [{ data }, meta] = await Promise.all([
    supabase
      .from("materias")
      .select("id, nombre, color, creditos, evaluaciones(porcentaje, nota)")
      .eq("semestre_id", semestre.id)
      .order("nombre"),
    notaAprobatoria(supabase, usuario.id),
  ]);
  const materias = ((data ?? []) as MateriaConNotas[]).map((m) => ({
    ...m,
    resumen: resumenMateria(m.evaluaciones, meta),
  }));
  if (materias.length === 0) return <SinMaterias titulo="Notas" />;

  const promedio = promedioSemestre(materias.map((m) => ({ creditos: m.creditos, llevo: m.resumen.llevo })));
  const enRiesgo = materias.filter((m) => tonoDe(m.resumen) === "alerta").length;

  return (
    <>
      <header className="degradado-tema flex flex-wrap items-end justify-between gap-4 rounded-2xl p-5 text-sobre-barra sm:p-6">
        <div>
          <p className="text-sm font-medium opacity-90">{semestre.nombre}</p>
          <h1 className="text-2xl font-bold sm:text-3xl">Notas</h1>
          <p className="mt-1 text-sm opacity-90">
            Para aprobar: {formatoNota(meta)}
            {enRiesgo > 0 && ` · ${enRiesgo} ${enRiesgo === 1 ? "materia en riesgo" : "materias en riesgo"}`}
          </p>
        </div>
        <div className="sm:text-right">
          <p className="text-sm opacity-90">Promedio del semestre</p>
          <p className="text-4xl font-bold tabular-nums">{promedio == null ? "—" : formatoNota(promedio, 2)}</p>
        </div>
      </header>
      <Mensajes {...await searchParams} />

      <ul className="grid gap-3 sm:grid-cols-2">
        {materias.map((m) => {
          const r = m.resumen;
          const tono = tonoDe(r);
          return (
            <li key={m.id}>
              <Link
                href={`/materias/${m.id}#notas`}
                className="flex h-full gap-3 rounded-2xl bg-superficie p-4 hover:outline-2 hover:outline-primario"
              >
                <span className="w-1.5 shrink-0 rounded-full" style={{ backgroundColor: m.color }} aria-hidden />
                <span className="flex min-w-0 flex-1 flex-col gap-2">
                  <span className="flex items-start justify-between gap-2">
                    <span>
                      <span className="block font-semibold">{m.nombre}</span>
                      <span className="text-sm opacity-80">
                        {m.creditos != null ? `${m.creditos} créditos · ` : ""}
                        {formatoNota(r.calificado, r.calificado % 1 ? 1 : 0)} % calificado
                      </span>
                    </span>
                    <span className="text-right">
                      <span className="block text-2xl font-bold tabular-nums">
                        {r.llevo == null ? "—" : formatoNota(r.llevo, 2)}
                      </span>
                      <span className="text-xs opacity-80">llevo</span>
                    </span>
                  </span>
                  <span
                    className={`rounded-lg px-2 py-1 text-sm ${
                      tono === "bien"
                        ? "bg-primario text-sobre-primario"
                        : tono === "alerta"
                          ? "bg-alerta text-sobre-alerta"
                          : "bg-fondo"
                    }`}
                  >
                    {frasePara(r, meta)}
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
      <p className="text-sm opacity-80">
        El promedio del semestre pondera por créditos lo que llevas en cada materia con notas. Para registrar notas o
        calcular con otra meta, abre la materia.
      </p>
    </>
  );
}
