import Link from "next/link";
import { notFound } from "next/navigation";
import { Boton } from "@/components/boton";
import { Campo } from "@/components/campo";
import { CamposMateria } from "@/components/campos-materia";
import { Mensajes } from "@/components/mensajes";
import { Pizarron } from "@/components/pizarron";
import { DIAS, formatoHora } from "@/lib/horario/horario";
import { ResumenNotas } from "@/components/notas";
import { TIPOS_BLOQUE, TIPOS_EVALUACION, type Apunte, type Bloque, type Evaluacion, type Materia } from "@/lib/modelos";
import { formatoNota, leerNota, resumenMateria } from "@/lib/notas";
import { notaAprobatoria, requerirUsuario, zonaDelUsuario } from "@/lib/sesion";
import { fechaHora } from "@/lib/zona";
import { guardarNotas } from "../../notas/acciones";
import { agregarBloque, editarMateria, eliminarBloque, eliminarMateria } from "../acciones";

export default async function PaginaMateria({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { id } = await params;
  // Valores del formulario de horario que se conservan tras un error.
  const { error, ok, dia_semana, hora_inicio, hora_fin, salon, tipo, meta: metaTexto } = await searchParams;
  const { supabase, usuario } = await requerirUsuario();
  const [{ data }, { data: apuntes }, aprobatoria, zona] = await Promise.all([
    supabase.from("materias").select("*, bloques_horario(*), evaluaciones(*)").eq("id", id).maybeSingle(),
    supabase
      .from("apuntes")
      .select("*")
      .eq("materia_id", id)
      .order("fecha", { ascending: false })
      .order("creado_en", { ascending: false }),
    notaAprobatoria(supabase, usuario.id),
    zonaDelUsuario(supabase, usuario.id),
  ]);
  if (!data) notFound();

  const materia = data as Materia & { bloques_horario: Bloque[]; evaluaciones: Evaluacion[] };
  const evaluaciones = [...materia.evaluaciones].sort(
    (a, b) => (a.fecha ?? "9999").localeCompare(b.fecha ?? "9999") || a.creado_en.localeCompare(b.creado_en),
  );
  // La meta de la calculadora llega por la URL (?meta=4,0); si no, la nota aprobatoria.
  const meta = leerNota(metaTexto) ?? aprobatoria;
  const resumen = resumenMateria(evaluaciones, meta);
  const bloques = [...materia.bloques_horario].sort(
    (a, b) => a.dia_semana - b.dia_semana || a.hora_inicio.localeCompare(b.hora_inicio),
  );

  return (
    <>
      <div className="flex items-center gap-3">
        <span className="size-4 rounded-full" style={{ backgroundColor: materia.color }} aria-hidden />
        <h1 className="text-2xl font-bold">{materia.nombre}</h1>
      </div>
      <Link href="/materias" className="-mt-4 text-sm underline">
        Volver a materias
      </Link>
      <Mensajes error={error} ok={ok} />

      <Pizarron materiaId={materia.id} apuntes={(apuntes ?? []) as Apunte[]} />

      <section id="notas" className="flex flex-col gap-4 rounded-2xl bg-superficie p-4 sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="text-lg font-semibold">Notas</h2>
          <form className="flex items-end gap-2" aria-label="Calculadora de nota necesaria">
            <label className="flex flex-col gap-1 text-sm font-medium">
              Meta
              <input
                name="meta"
                inputMode="decimal"
                defaultValue={formatoNota(meta)}
                pattern="[0-5]([,.][0-9])?"
                title="Una nota de 0,0 a 5,0"
                className="w-20 rounded-lg border border-texto/20 bg-fondo px-3 py-2 text-base font-normal"
              />
            </label>
            <Boton type="submit" variante="secundario">
              Calcular
            </Boton>
          </form>
        </div>
        <ResumenNotas resumen={resumen} meta={meta} />

        {evaluaciones.length === 0 ? (
          <p className="text-sm">
            Todavía no hay plan de evaluación.{" "}
            <Link href={`/evaluaciones?materia_id=${materia.id}`} className="font-medium underline">
              Agrega los parciales y lo que vale cada uno
            </Link>
            .
          </p>
        ) : (
          <form key={`${error}${ok}`} action={guardarNotas} className="flex flex-col gap-3 border-t border-texto/15 pt-4">
            <input type="hidden" name="materia_id" value={materia.id} />
            <ul className="flex flex-col gap-2">
              {evaluaciones.map((e) => (
                <li key={e.id} className="flex items-center gap-3 rounded-xl bg-fondo px-3 py-2">
                  <span className="min-w-0 flex-1">
                    <span className="font-medium">{e.nombre}</span>{" "}
                    <span className="text-sm opacity-80">· {formatoNota(Number(e.porcentaje), Number(e.porcentaje) % 1 ? 1 : 0)} %</span>
                    <span className="block text-sm opacity-80">
                      {[TIPOS_EVALUACION.find((t) => t.valor === e.tipo)?.nombre, e.fecha ? fechaHora(e.fecha, zona) : "Sin fecha"]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  </span>
                  <label className="flex items-center gap-2 text-sm">
                    <span className="sr-only">Nota de {e.nombre}</span>
                    <input
                      name={`nota_${e.id}`}
                      inputMode="decimal"
                      defaultValue={e.nota == null ? "" : formatoNota(Number(e.nota))}
                      placeholder="—"
                      pattern="[0-5]([,.][0-9])?"
                      title="Una nota de 0,0 a 5,0"
                      className="w-16 rounded-lg border border-texto/20 bg-superficie px-2 py-1.5 text-center text-base font-semibold"
                    />
                  </label>
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap items-center gap-3">
              <Boton type="submit">Guardar notas</Boton>
              <Link href={`/evaluaciones?materia_id=${materia.id}`} className="text-sm underline">
                Agregar evaluación al plan
              </Link>
            </div>
          </form>
        )}
      </section>

      <section className="flex flex-col gap-4 rounded-2xl bg-superficie p-4 sm:p-6">
        <h2 className="text-lg font-semibold">Horario</h2>
        {bloques.length === 0 ? (
          <p className="text-sm">Todavía no tiene horario. Agrega cada día que tienes esta materia.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {bloques.map((b) => (
              <li key={b.id} className="flex items-center gap-3 rounded-xl bg-fondo px-3 py-2">
                <span className="flex-1">
                  <span className="font-medium">{DIAS[b.dia_semana - 1].nombre}</span>{" "}
                  {formatoHora(b.hora_inicio)} a {formatoHora(b.hora_fin)}
                  <span className="block text-sm opacity-80">
                    {[TIPOS_BLOQUE.find((t) => t.valor === b.tipo)?.nombre, b.salon]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                </span>
                <form action={eliminarBloque}>
                  <input type="hidden" name="id" value={b.id} />
                  <input type="hidden" name="materia_id" value={materia.id} />
                  <button type="submit" className="text-sm underline" aria-label={`Quitar ${DIAS[b.dia_semana - 1].nombre}`}>
                    Quitar
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}

        <form key={`${error}${ok}`} action={agregarBloque} className="flex flex-col gap-3 border-t border-texto/15 pt-4">
          <input type="hidden" name="materia_id" value={materia.id} />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            <label className="flex flex-col gap-1 text-sm font-medium">
              Día
              <select name="dia_semana" defaultValue={dia_semana} className="rounded-lg border border-texto/20 bg-fondo px-3 py-2 text-base font-normal">
                {DIAS.map((d) => (
                  <option key={d.numero} value={d.numero}>
                    {d.nombre}
                  </option>
                ))}
              </select>
            </label>
            <Campo etiqueta="Desde" name="hora_inicio" type="time" defaultValue={hora_inicio ?? "07:00"} required />
            <Campo etiqueta="Hasta" name="hora_fin" type="time" defaultValue={hora_fin ?? "09:00"} required />
            <Campo etiqueta="Salón" name="salon" defaultValue={salon} placeholder="203" />
            <label className="flex flex-col gap-1 text-sm font-medium">
              Tipo
              <select name="tipo" defaultValue={tipo} className="rounded-lg border border-texto/20 bg-fondo px-3 py-2 text-base font-normal">
                {TIPOS_BLOQUE.map((t) => (
                  <option key={t.valor} value={t.valor}>
                    {t.nombre}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="permitir_choque" className="accent-primario" />
            Guardar aunque se cruce con otra materia
          </label>
          <Boton type="submit" className="self-start">
            Agregar al horario
          </Boton>
        </form>
      </section>

      <form action={editarMateria} className="flex flex-col gap-4 rounded-2xl bg-superficie p-4 sm:p-6">
        <h2 className="text-lg font-semibold">Datos de la materia</h2>
        <input type="hidden" name="id" value={materia.id} />
        <CamposMateria materia={materia} />
        <Boton type="submit" className="self-start">
          Guardar cambios
        </Boton>
      </form>

      <details className="rounded-2xl bg-superficie p-4">
        <summary className="cursor-pointer text-sm font-medium">Eliminar materia</summary>
        <form action={eliminarMateria} className="mt-3 flex flex-col gap-2">
          <input type="hidden" name="id" value={materia.id} />
          <p className="text-sm">Se borra la materia con su horario. No se puede deshacer.</p>
          <Boton variante="peligro" className="self-start">
            Sí, eliminar {materia.nombre}
          </Boton>
        </form>
      </details>
    </>
  );
}
