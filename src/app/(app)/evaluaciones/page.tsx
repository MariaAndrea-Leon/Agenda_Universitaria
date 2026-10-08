import { Boton } from "@/components/boton";
import { Campo } from "@/components/campo";
import { Mensajes } from "@/components/mensajes";
import { ESTILO_SELECT, ItemEvaluacion, Punto } from "@/components/pendientes";
import { SinMaterias, SinSemestre } from "@/components/sin-semestre";
import { evaluacionesDelSemestre, materiasDelSemestre } from "@/lib/consultas";
import { TIPOS_EVALUACION } from "@/lib/modelos";
import { sumaPorcentajes } from "@/lib/pendientes";
import { requerirUsuario, semestreActivo, zonaDelUsuario } from "@/lib/sesion";
import { eliminarEvaluacion, crearEvaluacion } from "./acciones";

export default async function PaginaEvaluaciones({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { error, ok, ...previosTodos } = await searchParams;
  const previos = error ? previosTodos : {};
  const { supabase, usuario } = await requerirUsuario();
  const semestre = await semestreActivo(supabase);
  if (!semestre) return <SinSemestre titulo="Exámenes" />;

  const [materias, evaluaciones, zona] = await Promise.all([
    materiasDelSemestre(supabase, semestre.id),
    evaluacionesDelSemestre(supabase, semestre.id),
    zonaDelUsuario(supabase, usuario.id),
  ]);
  if (materias.length === 0) return <SinMaterias titulo="Exámenes" />;

  const ahora = new Date();
  const proximas = evaluaciones.filter((e) => e.fecha && new Date(e.fecha) >= ahora);
  const sinFecha = evaluaciones.filter((e) => !e.fecha);
  const pasadas = evaluaciones.filter((e) => e.fecha && new Date(e.fecha) < ahora).reverse();

  const lista = (titulo: string, items: typeof evaluaciones) =>
    items.length > 0 && (
      <section className="flex flex-col gap-2">
        <h2 className="font-semibold">
          {titulo} <span className="font-normal opacity-70">({items.length})</span>
        </h2>
        <ul className="flex flex-col gap-2">
          {items.map((e) => (
            <ItemEvaluacion key={e.id} evaluacion={e} ahora={ahora} zona={zona} accionEliminar={eliminarEvaluacion} />
          ))}
        </ul>
      </section>
    );

  return (
    <>
      <div>
        <h1 className="text-2xl font-bold">Exámenes y evaluaciones</h1>
        <p className="text-sm opacity-80">
          Parciales, quices, talleres y exposiciones con lo que vale cada uno. En la fase de notas se les pondrá la
          calificación.
        </p>
      </div>
      <Mensajes error={error} ok={ok} />

      <form
        key={JSON.stringify(previos)}
        action={crearEvaluacion}
        className="flex flex-col gap-3 rounded-2xl bg-superficie p-4 sm:p-6"
      >
        <h2 className="text-lg font-semibold">Nueva evaluación</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Campo etiqueta="Nombre" name="nombre" defaultValue={previos.nombre} placeholder="Parcial 1" required />
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
          <label className="flex flex-col gap-1 text-sm font-medium">
            Tipo
            <select name="tipo" defaultValue={previos.tipo ?? "examen"} className={ESTILO_SELECT}>
              {TIPOS_EVALUACION.map((t) => (
                <option key={t.valor} value={t.valor}>
                  {t.nombre}
                </option>
              ))}
            </select>
          </label>
          <Campo
            etiqueta="Porcentaje (%)"
            name="porcentaje"
            type="number"
            inputMode="decimal"
            min="0.5"
            max="100"
            step="0.5"
            defaultValue={previos.porcentaje}
            placeholder="30"
            required
          />
          <Campo etiqueta="Fecha y hora (opcional)" name="fecha" type="datetime-local" defaultValue={previos.fecha} />
          <Campo etiqueta="Salón (opcional)" name="salon" defaultValue={previos.salon} placeholder="B-204" />
        </div>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Temas (opcional)
          <textarea
            name="temas"
            rows={2}
            defaultValue={previos.temas}
            className="rounded-lg border border-texto/20 bg-fondo px-3 py-2 text-base font-normal"
          />
        </label>
        <Boton type="submit" className="self-start">
          Agregar evaluación
        </Boton>
      </form>

      <section className="flex flex-col gap-2 rounded-2xl bg-superficie p-4 sm:p-6">
        <h2 className="font-semibold">Porcentaje asignado por materia</h2>
        <ul className="flex flex-col gap-2">
          {materias.map((m) => {
            const usado = sumaPorcentajes(evaluaciones.filter((e) => e.materia.id === m.id));
            return (
              <li key={m.id} className="flex items-center gap-3 text-sm">
                <Punto color={m.color} />
                <span className="w-40 shrink-0 truncate font-medium sm:w-56">{m.nombre}</span>
                <span
                  className="h-2 flex-1 overflow-hidden rounded-full bg-fondo"
                  role="progressbar"
                  aria-label={`Porcentaje asignado en ${m.nombre}`}
                  aria-valuenow={usado}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <span className="block h-full rounded-full" style={{ width: `${Math.min(usado, 100)}%`, backgroundColor: m.color }} />
                </span>
                <span className="w-14 text-right tabular-nums">{usado} %</span>
              </li>
            );
          })}
        </ul>
      </section>

      <div className="flex flex-col gap-5 rounded-2xl bg-superficie p-4 sm:p-6">
        {evaluaciones.length === 0 && <p className="text-sm">Aquí aparecerán tus exámenes y evaluaciones.</p>}
        {lista("Próximas", proximas)}
        {lista("Sin fecha", sinFecha)}
        {lista("Ya pasaron", pasadas)}
      </div>
    </>
  );
}
