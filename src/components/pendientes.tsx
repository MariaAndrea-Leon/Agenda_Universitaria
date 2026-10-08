import { alternarTarea, crearTarea, eliminarTarea } from "@/app/(app)/tareas/acciones";
import { Boton } from "@/components/boton";
import { Campo } from "@/components/campo";
import type { EvaluacionConMateria, TareaConMateria } from "@/lib/consultas";
import { PRIORIDADES, TIPOS_EVALUACION, type MateriaCorta } from "@/lib/modelos";
import { formatoNota } from "@/lib/notas";
import { cuandoEs, diaEnZona, fechaHora } from "@/lib/zona";

const ESTILO_SELECT = "rounded-lg border border-texto/20 bg-fondo px-3 py-2 text-base font-normal";

export function Punto({ color }: { color: string }) {
  return <span className="mt-1.5 size-3 shrink-0 rounded-full" style={{ backgroundColor: color }} aria-hidden />;
}

export function ItemTarea({
  tarea,
  ahora,
  zona,
  volver,
}: {
  tarea: TareaConMateria;
  ahora: Date;
  zona: string;
  volver: string;
}) {
  const hecha = Boolean(tarea.completada_en);
  const cuando = cuandoEs(tarea.entrega, ahora, zona);
  const vencida = !hecha && cuando === "Vencida";

  return (
    <li className="flex items-start gap-3 rounded-xl bg-fondo px-3 py-2">
      <form action={alternarTarea}>
        <input type="hidden" name="id" value={tarea.id} />
        <input type="hidden" name="hecha" value={hecha ? "1" : "0"} />
        <button
          type="submit"
          aria-label={hecha ? `Marcar "${tarea.titulo}" como pendiente` : `Marcar "${tarea.titulo}" como hecha`}
          className={`mt-0.5 grid size-6 place-items-center rounded-md border-2 border-primario ${hecha ? "bg-primario text-sobre-primario" : ""}`}
        >
          {hecha && (
            <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden>
              <path d="M5 12l5 5L20 7" />
            </svg>
          )}
        </button>
      </form>
      <div className="min-w-0 flex-1">
        <p className={`font-medium ${hecha ? "line-through opacity-60" : ""}`}>{tarea.titulo}</p>
        <p className="flex flex-wrap items-center gap-x-2 text-sm opacity-80">
          <span className="inline-flex items-center gap-1">
            <span className="size-2 rounded-full" style={{ backgroundColor: tarea.materia.color }} aria-hidden />
            {tarea.materia.nombre}
          </span>
          <span>{fechaHora(tarea.entrega, zona)}</span>
        </p>
        {tarea.descripcion && <p className="mt-1 text-sm opacity-80">{tarea.descripcion}</p>}
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        {!hecha && (
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-bold ${
              vencida ? "bg-alerta text-sobre-alerta" : cuando === "Hoy" ? "bg-acento text-sobre-acento" : "bg-superficie"
            }`}
          >
            {cuando}
          </span>
        )}
        {tarea.prioridad === "alta" && !hecha && <span className="text-xs font-bold">Prioridad alta</span>}
        <form action={eliminarTarea}>
          <input type="hidden" name="id" value={tarea.id} />
          <input type="hidden" name="volver" value={volver} />
          <button type="submit" className="text-xs underline opacity-70" aria-label={`Eliminar "${tarea.titulo}"`}>
            Eliminar
          </button>
        </form>
      </div>
    </li>
  );
}

export function ItemEvaluacion({
  evaluacion,
  ahora,
  zona,
  accionEliminar,
}: {
  evaluacion: EvaluacionConMateria;
  ahora: Date;
  zona: string;
  accionEliminar?: (f: FormData) => Promise<void>;
}) {
  const e = evaluacion;
  const tipo = TIPOS_EVALUACION.find((t) => t.valor === e.tipo)?.nombre;
  const cuando = e.fecha ? cuandoEs(e.fecha, ahora, zona) : null;
  const pasada = cuando === "Vencida";

  return (
    <li className="flex items-start gap-3 rounded-xl bg-fondo px-3 py-2">
      <Punto color={e.materia.color} />
      <div className="min-w-0 flex-1">
        <p className="font-medium">
          {e.nombre} <span className="text-sm font-normal opacity-80">· {Number(e.porcentaje)} %</span>
          {e.nota != null && (
            <span className="ml-2 rounded-full bg-primario px-2 py-0.5 text-xs font-bold text-sobre-primario">
              Nota {formatoNota(Number(e.nota))}
            </span>
          )}
        </p>
        <p className="text-sm opacity-80">
          {[e.materia.nombre, tipo, e.fecha ? fechaHora(e.fecha, zona) : "Sin fecha", e.salon && `Salón ${e.salon}`]
            .filter(Boolean)
            .join(" · ")}
        </p>
        {e.temas && <p className="mt-1 text-sm opacity-80">Temas: {e.temas}</p>}
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        {cuando && !pasada && (
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-bold ${
              cuando === "Hoy" || cuando === "Mañana" ? "bg-alerta text-sobre-alerta" : "bg-superficie"
            }`}
          >
            {cuando}
          </span>
        )}
        {pasada && <span className="text-xs opacity-70">Ya pasó</span>}
        {accionEliminar && (
          <form action={accionEliminar}>
            <input type="hidden" name="id" value={e.id} />
            <button type="submit" className="text-xs underline opacity-70" aria-label={`Eliminar "${e.nombre}"`}>
              Eliminar
            </button>
          </form>
        )}
      </div>
    </li>
  );
}

// Formulario de nueva tarea. "previos" son los valores que se conservan
// cuando la acción devuelve un error.
export function FormularioTarea({
  materias,
  zona,
  volver,
  previos = {},
}: {
  materias: MateriaCorta[];
  zona: string;
  volver: string;
  previos?: Record<string, string | undefined>;
}) {
  const hoy = diaEnZona(new Date(), zona);
  return (
    <form
      key={JSON.stringify(previos)}
      action={crearTarea}
      className="flex flex-col gap-3 rounded-2xl bg-superficie p-4 sm:p-6"
    >
      <h2 className="text-lg font-semibold">Nueva tarea</h2>
      <input type="hidden" name="volver" value={volver} />
      <div className="grid gap-3 sm:grid-cols-2">
        <Campo
          etiqueta="Qué hay que entregar"
          name="titulo"
          defaultValue={previos.titulo}
          placeholder="Taller 3 de derivadas"
          required
        />
        <label className="flex flex-col gap-1 text-sm font-medium">
          Materia
          <select name="materia_id" defaultValue={previos.materia_id} required className={ESTILO_SELECT}>
            {materias.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nombre}
              </option>
            ))}
          </select>
        </label>
        <Campo
          etiqueta="Entrega"
          name="entrega"
          type="datetime-local"
          defaultValue={previos.entrega ?? `${hoy}T23:59`}
          required
        />
        <label className="flex flex-col gap-1 text-sm font-medium">
          Prioridad
          <select name="prioridad" defaultValue={previos.prioridad ?? "media"} className={ESTILO_SELECT}>
            {PRIORIDADES.map((p) => (
              <option key={p.valor} value={p.valor}>
                {p.nombre}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="flex flex-col gap-1 text-sm font-medium">
        Notas (opcional)
        <textarea
          name="descripcion"
          rows={2}
          defaultValue={previos.descripcion}
          className="rounded-lg border border-texto/20 bg-fondo px-3 py-2 text-base font-normal"
        />
      </label>
      <Boton type="submit" className="self-start">
        Agregar tarea
      </Boton>
    </form>
  );
}

export { ESTILO_SELECT };
