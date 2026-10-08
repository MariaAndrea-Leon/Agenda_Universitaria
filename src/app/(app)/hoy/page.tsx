import Link from "next/link";
import { Mensajes } from "@/components/mensajes";
import { FormularioTarea, ItemEvaluacion, ItemTarea, Punto } from "@/components/pendientes";
import { SinMaterias, SinSemestre } from "@/components/sin-semestre";
import {
  bloquesDelSemestre,
  evaluacionesDelSemestre,
  materiasDelSemestre,
  tareasDelSemestre,
  type TareaConMateria,
} from "@/lib/consultas";
import { aMinutos, formatoHora } from "@/lib/horario/horario";
import { TIPOS_BLOQUE } from "@/lib/modelos";
import { agruparTareas } from "@/lib/pendientes";
import { frasePara, tonoDe } from "@/components/notas";
import { resumenMateria } from "@/lib/notas";
import { notaAprobatoria, requerirUsuario, semestreActivo, zonaDelUsuario } from "@/lib/sesion";
import { diaEnZona, diaLargo, diasEntre, diaSemana, partesEnZona } from "@/lib/zona";

export default async function PaginaHoy({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { error, ok, ...previos } = await searchParams;
  const { supabase, usuario } = await requerirUsuario();
  const semestre = await semestreActivo(supabase);
  if (!semestre) return <SinSemestre titulo="Hoy" />;

  const [materias, tareas, evaluaciones, bloques, zona, meta] = await Promise.all([
    materiasDelSemestre(supabase, semestre.id),
    tareasDelSemestre(supabase, semestre.id),
    evaluacionesDelSemestre(supabase, semestre.id),
    bloquesDelSemestre(supabase, semestre.id),
    zonaDelUsuario(supabase, usuario.id),
    notaAprobatoria(supabase, usuario.id),
  ]);
  if (materias.length === 0) return <SinMaterias titulo="Hoy" />;

  // Materias que necesitan más de 4,0 en lo que falta o que ya no alcanzan.
  const enRiesgo = materias
    .map((m) => ({ ...m, resumen: resumenMateria(evaluaciones.filter((e) => e.materia.id === m.id), meta) }))
    .filter((m) => tonoDe(m.resumen) === "alerta");

  const ahora = new Date();
  const hoy = diaEnZona(ahora, zona);
  const p = partesEnZona(ahora, zona);
  const minutoActual = p.hora * 60 + p.minuto;

  const clases = bloques.filter((b) => b.dia_semana === diaSemana(hoy));
  const g = agruparTareas(tareas, ahora, zona);
  const examenes = evaluaciones.filter((e) => {
    if (!e.fecha || new Date(e.fecha) < ahora) return false;
    return diasEntre(hoy, diaEnZona(new Date(e.fecha), zona)) <= 7;
  });

  const lista = (titulo: string, items: TareaConMateria[], vacio?: string) => (
    <section className="flex flex-col gap-2">
      <h2 className="font-semibold">{titulo}</h2>
      {items.length === 0 ? (
        vacio && <p className="text-sm opacity-80">{vacio}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((t) => (
            <ItemTarea key={t.id} tarea={t} ahora={ahora} zona={zona} volver="/hoy" />
          ))}
        </ul>
      )}
    </section>
  );

  return (
    <>
      <header className="degradado-tema rounded-2xl p-5 text-sobre-barra sm:p-6">
        <p className="text-sm font-medium opacity-90">{semestre.nombre}</p>
        <h1 className="text-2xl font-bold first-letter:uppercase sm:text-3xl">{diaLargo(hoy)}</h1>
        <p className="mt-1 text-sm opacity-90">
          {resumen(clases.length, g.hoy.length, g.vencidas.length, examenes.length)}
        </p>
      </header>
      <Mensajes error={error} ok={ok} />

      {enRiesgo.length > 0 && (
        <section aria-labelledby="titulo-riesgo" className="flex flex-col gap-2 rounded-2xl bg-alerta p-4 text-sobre-alerta sm:p-6">
          <h2 id="titulo-riesgo" className="font-semibold">
            {enRiesgo.length === 1 ? "Una materia necesita atención" : `${enRiesgo.length} materias necesitan atención`}
          </h2>
          <ul className="flex flex-col gap-1 text-sm">
            {enRiesgo.map((m) => (
              <li key={m.id}>
                <Link href={`/materias/${m.id}#notas`} className="font-semibold underline">
                  {m.nombre}
                </Link>
                : {frasePara(m.resumen, meta)}
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="flex flex-col gap-2 rounded-2xl bg-superficie p-4 sm:p-6">
          <h2 className="font-semibold">Clases de hoy</h2>
          {clases.length === 0 ? (
            <p className="text-sm opacity-80">Hoy no tienes clases.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {clases.map((b) => {
                const enCurso = minutoActual >= aMinutos(b.hora_inicio) && minutoActual < aMinutos(b.hora_fin);
                const termino = minutoActual >= aMinutos(b.hora_fin);
                const tipo = TIPOS_BLOQUE.find((t) => t.valor === b.tipo)?.nombre;
                return (
                  <li
                    key={b.id}
                    className={`flex items-start gap-3 rounded-xl px-3 py-2 ${termino ? "border border-texto/15" : "bg-fondo"}`}
                  >
                    <Punto color={b.materia.color} />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{b.materia.nombre}</p>
                      <p className="text-sm opacity-80">
                        {[`${formatoHora(b.hora_inicio)} a ${formatoHora(b.hora_fin)}`, tipo, b.salon && `Salón ${b.salon}`]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    </div>
                    {termino && <span className="text-xs">Terminó</span>}
                    {enCurso && (
                      <span className="rounded-full bg-acento px-2 py-0.5 text-xs font-bold text-sobre-acento">Ahora</span>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="flex flex-col gap-2 rounded-2xl bg-superficie p-4 sm:p-6">
          <h2 className="font-semibold">Exámenes de los próximos 7 días</h2>
          {examenes.length === 0 ? (
            <p className="text-sm opacity-80">No hay evaluaciones en los próximos 7 días.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {examenes.map((e) => (
                <ItemEvaluacion key={e.id} evaluacion={e} ahora={ahora} zona={zona} />
              ))}
            </ul>
          )}
          <Link href="/evaluaciones" className="mt-1 self-start text-sm font-medium underline">
            Ver todas las evaluaciones
          </Link>
        </section>
      </div>

      <div className="flex flex-col gap-5 rounded-2xl bg-superficie p-4 sm:p-6">
        {g.vencidas.length > 0 && lista("Vencidas", g.vencidas)}
        {lista("Para hoy", g.hoy, "Nada para entregar hoy.")}
        {lista("Próximos 7 días", g.semana, "Nada en los próximos 7 días.")}
        <Link href="/tareas" className="self-start text-sm font-medium underline">
          Ver todas las tareas
        </Link>
      </div>

      <FormularioTarea materias={materias} zona={zona} volver="/hoy" previos={error ? previos : {}} />
    </>
  );
}

function resumen(clases: number, tareasHoy: number, vencidas: number, examenes: number): string {
  const plural = (n: number, uno: string, varios: string) => `${n} ${n === 1 ? uno : varios}`;
  const partes = [
    clases > 0 ? plural(clases, "clase", "clases") : "Sin clases",
    tareasHoy > 0 ? plural(tareasHoy, "entrega hoy", "entregas hoy") : "ninguna entrega hoy",
  ];
  if (vencidas > 0) partes.push(plural(vencidas, "vencida", "vencidas"));
  if (examenes > 0) partes.push(plural(examenes, "examen esta semana", "exámenes esta semana"));
  return partes.join(" · ");
}
