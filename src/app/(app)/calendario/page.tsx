import Link from "next/link";
import { ItemEvaluacion, ItemTarea } from "@/components/pendientes";
import { SinSemestre } from "@/components/sin-semestre";
import { evaluacionesDelSemestre, tareasDelSemestre } from "@/lib/consultas";
import { mesValido, mesVecino, nombreDelMes, semanasDelMes } from "@/lib/calendario";
import { requerirUsuario, semestreActivo, zonaDelUsuario } from "@/lib/sesion";
import { diaEnZona, diaLargo } from "@/lib/zona";

const NOMBRES_DIAS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const MAX_POR_DIA = 3;

interface Evento {
  id: string;
  dia: string;
  titulo: string;
  color: string;
  hora: string;
  tipo: "tarea" | "evaluacion";
  hecha: boolean;
}

export default async function PaginaCalendario({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const parametros = await searchParams;
  const { supabase, usuario } = await requerirUsuario();
  const semestre = await semestreActivo(supabase);
  if (!semestre) return <SinSemestre titulo="Calendario" />;

  const [tareas, evaluaciones, zona] = await Promise.all([
    tareasDelSemestre(supabase, semestre.id),
    evaluacionesDelSemestre(supabase, semestre.id),
    zonaDelUsuario(supabase, usuario.id),
  ]);

  const ahora = new Date();
  const hoy = diaEnZona(ahora, zona);
  const mes = mesValido(parametros.mes) ?? hoy.slice(0, 7);
  const semanas = semanasDelMes(mes);

  const eventos: Evento[] = [
    ...tareas.map((t) => ({
      id: t.id,
      dia: diaEnZona(new Date(t.entrega), zona),
      titulo: t.titulo,
      color: t.materia.color,
      hora: t.entrega,
      tipo: "tarea" as const,
      hecha: Boolean(t.completada_en),
    })),
    ...evaluaciones
      .filter((e) => e.fecha)
      .map((e) => ({
        id: e.id,
        dia: diaEnZona(new Date(e.fecha!), zona),
        titulo: e.nombre,
        color: e.materia.color,
        hora: e.fecha!,
        tipo: "evaluacion" as const,
        hecha: false,
      })),
  ].sort((a, b) => a.hora.localeCompare(b.hora));

  const porDia = new Map<string, Evento[]>();
  for (const e of eventos) porDia.set(e.dia, [...(porDia.get(e.dia) ?? []), e]);

  const diasDelMes = [...porDia.keys()].filter((d) => d.startsWith(mes)).sort();
  const tareaPorId = new Map(tareas.map((t) => [t.id, t]));
  const evaluacionPorId = new Map(evaluaciones.map((e) => [e.id, e]));

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold first-letter:uppercase">{nombreDelMes(mes)}</h1>
        <nav className="flex items-center gap-1" aria-label="Cambiar de mes">
          <Link
            href={`/calendario?mes=${mesVecino(mes, -1)}`}
            className="rounded-lg bg-superficie px-3 py-1.5 text-sm font-medium"
            aria-label="Mes anterior"
          >
            ‹ Anterior
          </Link>
          <Link href="/calendario" className="rounded-lg bg-superficie px-3 py-1.5 text-sm font-medium">
            Hoy
          </Link>
          <Link
            href={`/calendario?mes=${mesVecino(mes, 1)}`}
            className="rounded-lg bg-superficie px-3 py-1.5 text-sm font-medium"
            aria-label="Mes siguiente"
          >
            Siguiente ›
          </Link>
        </nav>
      </div>

      <div className="overflow-hidden rounded-2xl bg-superficie p-2 sm:p-3">
        <div className="grid grid-cols-7 gap-1 pb-1 text-center text-xs font-semibold opacity-80" aria-hidden>
          {NOMBRES_DIAS.map((d) => (
            <div key={d}>{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {semanas.flat().map((dia) => {
            const delMes = dia.startsWith(mes);
            const lista = porDia.get(dia) ?? [];
            const esHoy = dia === hoy;
            const contenido = (
              <>
                <span
                  className={`grid size-6 place-items-center rounded-full text-xs font-semibold ${
                    esHoy ? "bg-primario text-sobre-primario" : ""
                  }`}
                >
                  {Number(dia.slice(8))}
                </span>
                {/* En pantallas pequeñas solo puntos; en grandes, el título. */}
                <span className="flex flex-wrap gap-0.5 sm:hidden">
                  {lista.slice(0, 4).map((e) => (
                    <span key={e.id} className="size-1.5 rounded-full" style={{ backgroundColor: e.color }} />
                  ))}
                </span>
                <span className="hidden w-full flex-col gap-0.5 sm:flex">
                  {lista.slice(0, MAX_POR_DIA).map((e) => (
                    <span
                      key={e.id}
                      className={`truncate rounded px-1 text-left text-[11px] leading-4 ${e.hecha ? "line-through opacity-60" : ""} ${
                        e.tipo === "evaluacion" ? "font-bold" : ""
                      }`}
                      style={{ backgroundColor: `color-mix(in srgb, ${e.color} 28%, transparent)` }}
                    >
                      {e.titulo}
                    </span>
                  ))}
                  {lista.length > MAX_POR_DIA && (
                    <span className="text-left text-[11px] opacity-80">+{lista.length - MAX_POR_DIA} más</span>
                  )}
                </span>
              </>
            );
            const clases = `flex min-h-14 flex-col items-start gap-1 rounded-lg p-1 sm:min-h-24 ${
              delMes ? "bg-fondo" : "bg-fondo/40 opacity-50"
            }`;
            const etiqueta = `${diaLargo(dia)}${lista.length ? `, ${lista.length} pendientes` : ""}`;
            return lista.length > 0 && delMes ? (
              <a key={dia} href={`#dia-${dia}`} className={clases} aria-label={etiqueta}>
                {contenido}
              </a>
            ) : (
              <div key={dia} className={clases} aria-label={etiqueta}>
                {contenido}
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-5 rounded-2xl bg-superficie p-4 sm:p-6">
        {diasDelMes.length === 0 && <p className="text-sm">No hay entregas ni evaluaciones este mes.</p>}
        {diasDelMes.map((dia) => (
          <section key={dia} id={`dia-${dia}`} className="flex scroll-mt-4 flex-col gap-2">
            <h2 className="font-semibold first-letter:uppercase">
              {diaLargo(dia)}
              {dia === hoy && <span className="ml-2 text-sm font-normal opacity-80">(hoy)</span>}
            </h2>
            <ul className="flex flex-col gap-2">
              {porDia.get(dia)!.map((e) => {
                if (e.tipo === "tarea") {
                  const t = tareaPorId.get(e.id)!;
                  return <ItemTarea key={e.id} tarea={t} ahora={ahora} zona={zona} volver={`/calendario?mes=${mes}`} />;
                }
                return <ItemEvaluacion key={e.id} evaluacion={evaluacionPorId.get(e.id)!} ahora={ahora} zona={zona} />;
              })}
            </ul>
          </section>
        ))}
        <p className="text-xs opacity-70">Los exámenes y evaluaciones se ven en negrita en el calendario.</p>
      </div>
    </>
  );
}
