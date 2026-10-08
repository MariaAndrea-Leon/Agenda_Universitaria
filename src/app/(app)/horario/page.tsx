import Link from "next/link";
import { aMinutos, carriles, choques, DIAS, diasVisibles, formatoHora, rangoGrilla } from "@/lib/horario/horario";
import type { Bloque, Materia } from "@/lib/modelos";
import { requerirUsuario, semestreActivo } from "@/lib/sesion";

const ALTO_HORA = 56; // px por hora en la grilla

type BloqueConMateria = Bloque & { materia: Pick<Materia, "id" | "nombre" | "color"> };

export default async function PaginaHorario() {
  const { supabase } = await requerirUsuario();
  const semestre = await semestreActivo(supabase);

  if (!semestre) {
    return (
      <>
        <h1 className="text-2xl font-bold">Horario</h1>
        <p className="rounded-2xl bg-superficie p-4">
          Para armar tu horario, empieza creando tu semestre.{" "}
          <Link href="/semestres" className="font-medium underline">
            Crear semestre
          </Link>
        </p>
      </>
    );
  }

  const { data } = await supabase
    .from("bloques_horario")
    .select("*, materia:materias!inner(id, nombre, color, semestre_id)")
    .eq("materia.semestre_id", semestre.id);
  const bloques = ((data ?? []) as BloqueConMateria[]).sort(
    (a, b) => a.dia_semana - b.dia_semana || a.hora_inicio.localeCompare(b.hora_inicio),
  );

  if (bloques.length === 0) {
    return (
      <>
        <h1 className="text-2xl font-bold">Horario</h1>
        <p className="rounded-2xl bg-superficie p-4">
          Aún no hay clases en {semestre.nombre}.{" "}
          <Link href="/materias" className="font-medium underline">
            Agrega tus materias
          </Link>{" "}
          y el día y la hora de cada una.
        </p>
      </>
    );
  }

  const { desde, hasta } = rangoGrilla(bloques);
  const dias = diasVisibles(bloques);
  const lanes = carriles(bloques);
  const cruces = choques(bloques);
  const horas = Array.from({ length: (hasta - desde) / 60 }, (_, i) => desde / 60 + i);

  return (
    <>
      <div>
        <h1 className="text-2xl font-bold">Horario</h1>
        <p className="text-sm opacity-80">{semestre.nombre}</p>
      </div>

      {cruces.length > 0 && (
        <p role="alert" className="rounded-lg bg-alerta px-3 py-2 text-sm font-bold text-sobre-alerta">
          {cruces.length === 1 ? "Hay un cruce" : `Hay ${cruces.length} cruces`} de horario:{" "}
          {cruces
            .map(([a, b]) => `${a.materia.nombre} y ${b.materia.nombre} (${DIAS[a.dia_semana - 1].nombre.toLowerCase()})`)
            .join("; ")}
          .
        </p>
      )}

      {/* Celular: lista por día */}
      <div className="flex flex-col gap-4 sm:hidden">
        {dias
          .filter((d) => bloques.some((b) => b.dia_semana === d.numero))
          .map((d) => (
            <section key={d.numero}>
              <h2 className="mb-2 font-semibold">{d.nombre}</h2>
              <ul className="flex flex-col gap-2">
                {bloques
                  .filter((b) => b.dia_semana === d.numero)
                  .map((b) => (
                    <li key={b.id}>
                      <Link
                        href={`/materias/${b.materia.id}`}
                        className="flex gap-3 rounded-xl px-3 py-2 text-white"
                        style={{ backgroundColor: b.materia.color }}
                      >
                        <span className="w-24 shrink-0 text-sm">
                          {formatoHora(b.hora_inicio)} a {formatoHora(b.hora_fin)}
                        </span>
                        <span>
                          <span className="block font-medium">{b.materia.nombre}</span>
                          {b.salon && <span className="block text-sm opacity-90">{b.salon}</span>}
                        </span>
                      </Link>
                    </li>
                  ))}
              </ul>
            </section>
          ))}
      </div>

      {/* Computador y tableta: grilla semanal */}
      <div className="hidden overflow-x-auto rounded-2xl bg-superficie p-3 sm:block">
        <div
          className="grid min-w-[640px]"
          style={{ gridTemplateColumns: `3.5rem repeat(${dias.length}, minmax(0, 1fr))` }}
        >
          <div />
          {dias.map((d) => (
            <div key={d.numero} className="pb-2 text-center text-sm font-semibold">
              {d.nombre}
            </div>
          ))}

          <div className="relative" style={{ height: horas.length * ALTO_HORA }}>
            {horas.map((h, i) => (
              <span key={h} className="absolute right-2 -translate-y-1/2 text-xs opacity-70" style={{ top: i * ALTO_HORA }}>
                {h}:00
              </span>
            ))}
          </div>

          {dias.map((d) => (
            <div
              key={d.numero}
              className="relative border-l border-texto/10"
              style={{
                height: horas.length * ALTO_HORA,
                backgroundImage: `repeating-linear-gradient(to bottom, transparent 0 ${ALTO_HORA - 1}px, color-mix(in srgb, var(--texto) 10%, transparent) ${ALTO_HORA - 1}px ${ALTO_HORA}px)`,
              }}
            >
              {bloques
                .filter((b) => b.dia_semana === d.numero)
                .map((b) => {
                  const { carril, carriles: total } = lanes.get(b.id)!;
                  const top = ((aMinutos(b.hora_inicio) - desde) / 60) * ALTO_HORA;
                  const alto = ((aMinutos(b.hora_fin) - aMinutos(b.hora_inicio)) / 60) * ALTO_HORA;
                  return (
                    <Link
                      key={b.id}
                      href={`/materias/${b.materia.id}`}
                      className="absolute overflow-hidden rounded-lg p-1.5 text-xs text-white hover:brightness-110"
                      style={{
                        top,
                        height: alto - 2,
                        left: `calc(${(carril / total) * 100}% + 2px)`,
                        width: `calc(${100 / total}% - 4px)`,
                        backgroundColor: b.materia.color,
                      }}
                      title={`${b.materia.nombre} · ${formatoHora(b.hora_inicio)} a ${formatoHora(b.hora_fin)}`}
                    >
                      <span className="block font-semibold leading-tight">{b.materia.nombre}</span>
                      <span className="block opacity-90">
                        {formatoHora(b.hora_inicio)} a {formatoHora(b.hora_fin)}
                      </span>
                      {b.salon && <span className="block opacity-90">{b.salon}</span>}
                    </Link>
                  );
                })}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
