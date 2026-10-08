import { Boton } from "@/components/boton";
import { Campo } from "@/components/campo";
import { FormEliminar } from "@/components/eliminar";
import { Mensajes, type ParamsMensajes } from "@/components/mensajes";
import { fechaCorta } from "@/lib/fechas";
import type { Semestre } from "@/lib/modelos";
import { requerirUsuario } from "@/lib/sesion";
import { activarSemestre, crearSemestre, eliminarSemestre } from "./acciones";

export default async function PaginaSemestres({ searchParams }: { searchParams: ParamsMensajes }) {
  const { supabase } = await requerirUsuario();
  const { data } = await supabase.from("semestres").select("*").order("inicio", { ascending: false });
  const semestres = (data ?? []) as Semestre[];

  return (
    <>
      <h1 className="text-2xl font-bold">Semestres</h1>
      <Mensajes {...await searchParams} />

      {semestres.length === 0 ? (
        <p className="rounded-2xl bg-superficie p-4">
          Empieza creando tu semestre actual. Después podrás agregarle materias y horario.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {semestres.map((s) => (
            <li key={s.id} className="has-[[data-eliminando]]:hidden flex flex-wrap items-center gap-3 rounded-2xl bg-superficie p-4">
              <div className="flex-1">
                <p className="font-semibold">
                  {s.nombre}
                  {s.activo && (
                    <span className="ml-2 rounded-full bg-acento px-2 py-0.5 text-xs font-medium text-sobre-acento">
                      Activo
                    </span>
                  )}
                </p>
                <p className="text-sm opacity-80">
                  {fechaCorta(s.inicio)} a {fechaCorta(s.fin)}
                </p>
              </div>
              {!s.activo && (
                <form action={activarSemestre}>
                  <input type="hidden" name="id" value={s.id} />
                  <Boton variante="secundario">Marcar activo</Boton>
                </form>
              )}
              <FormEliminar
                action={eliminarSemestre}
                campos={{ id: s.id }}
                pregunta={`¿Seguro que quieres eliminar el semestre ${s.nombre}? Se borran también sus materias, horario, tareas, notas y apuntes.`}
                ariaLabel={`Eliminar el semestre ${s.nombre}`}
                enlace
              />
            </li>
          ))}
        </ul>
      )}

      <form action={crearSemestre} className="flex flex-col gap-4 rounded-2xl bg-superficie p-4 sm:p-6">
        <h2 className="text-lg font-semibold">Nuevo semestre</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <Campo etiqueta="Nombre" name="nombre" placeholder="2026-2" required />
          <Campo etiqueta="Inicio" name="inicio" type="date" required />
          <Campo etiqueta="Fin" name="fin" type="date" required />
        </div>
        {semestres.length > 0 && (
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="activar" className="accent-primario" />
            Marcarlo como semestre activo
          </label>
        )}
        <Boton type="submit" className="self-start">
          Crear semestre
        </Boton>
      </form>
    </>
  );
}
