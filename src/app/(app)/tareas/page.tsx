import { Mensajes } from "@/components/mensajes";
import { FormularioTarea, ItemTarea } from "@/components/pendientes";
import { SinMaterias, SinSemestre } from "@/components/sin-semestre";
import { materiasDelSemestre, tareasDelSemestre, type TareaConMateria } from "@/lib/consultas";
import { agruparTareas } from "@/lib/pendientes";
import { requerirUsuario, semestreActivo, zonaDelUsuario } from "@/lib/sesion";

export default async function PaginaTareas({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { error, ok, ...previos } = await searchParams;
  const { supabase, usuario } = await requerirUsuario();
  const semestre = await semestreActivo(supabase);
  if (!semestre) return <SinSemestre titulo="Tareas" />;

  const [materias, tareas, zona] = await Promise.all([
    materiasDelSemestre(supabase, semestre.id),
    tareasDelSemestre(supabase, semestre.id),
    zonaDelUsuario(supabase, usuario.id),
  ]);
  if (materias.length === 0) return <SinMaterias titulo="Tareas" />;

  const ahora = new Date();
  const g = agruparTareas(tareas, ahora, zona);
  const pendientes = g.vencidas.length + g.hoy.length + g.semana.length + g.despues.length;

  const seccion = (titulo: string, lista: TareaConMateria[]) =>
    lista.length > 0 && (
      <section key={titulo} className="flex flex-col gap-2">
        <h2 className="font-semibold">
          {titulo} <span className="font-normal opacity-70">({lista.length})</span>
        </h2>
        <ul className="flex flex-col gap-2">
          {lista.map((t) => (
            <ItemTarea key={t.id} tarea={t} ahora={ahora} zona={zona} volver="/tareas" />
          ))}
        </ul>
      </section>
    );

  return (
    <>
      <div>
        <h1 className="text-2xl font-bold">Tareas</h1>
        <p className="text-sm opacity-80">
          {pendientes === 0 ? "No tienes tareas pendientes." : `${pendientes} pendientes`}
        </p>
      </div>
      <Mensajes error={error} ok={ok} />
      <FormularioTarea materias={materias} zona={zona} volver="/tareas" previos={error ? previos : {}} />
      <div className="flex flex-col gap-5 rounded-2xl bg-superficie p-4 sm:p-6">
        {seccion("Vencidas", g.vencidas)}
        {seccion("Para hoy", g.hoy)}
        {seccion("Próximos 7 días", g.semana)}
        {seccion("Más adelante", g.despues)}
        {pendientes === 0 && g.hechas.length === 0 && <p className="text-sm">Aquí aparecerán tus tareas.</p>}
        {g.hechas.length > 0 && (
          <details>
            <summary className="cursor-pointer font-semibold">
              Hechas <span className="font-normal opacity-70">({g.hechas.length})</span>
            </summary>
            <ul className="mt-2 flex flex-col gap-2">
              {g.hechas.map((t) => (
                <ItemTarea key={t.id} tarea={t} ahora={ahora} zona={zona} volver="/tareas" />
              ))}
            </ul>
          </details>
        )}
      </div>
    </>
  );
}
