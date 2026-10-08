import Link from "next/link";
import { notFound } from "next/navigation";
import { Boton } from "@/components/boton";
import { Campo } from "@/components/campo";
import { CamposMateria } from "@/components/campos-materia";
import { Mensajes } from "@/components/mensajes";
import { DIAS, formatoHora } from "@/lib/horario/horario";
import { TIPOS_BLOQUE, type Bloque, type Materia } from "@/lib/modelos";
import { requerirUsuario } from "@/lib/sesion";
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
  const { error, ok, dia_semana, hora_inicio, hora_fin, salon, tipo } = await searchParams;
  const { supabase } = await requerirUsuario();
  const { data } = await supabase.from("materias").select("*, bloques_horario(*)").eq("id", id).maybeSingle();
  if (!data) notFound();

  const materia = data as Materia & { bloques_horario: Bloque[] };
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
