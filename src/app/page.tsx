import { SelectorTema } from "@/components/selector-tema";

// Página provisional de la fase 0: muestra los temas aplicados a piezas
// típicas de la agenda. Se reemplaza por el panel "Hoy" en la fase 2.
export default function Inicio() {
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 p-4 sm:p-8">
      <header className="degradado-tema rounded-2xl p-6 text-sobre-primario">
        <p className="text-sm opacity-90">Agenda Universitaria</p>
        <h1 className="text-3xl font-bold">Hoy</h1>
        <p className="mt-1 opacity-90">Vista previa de los temas · fase 0</p>
      </header>

      <section className="rounded-2xl bg-superficie p-4 sm:p-6">
        <SelectorTema />
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <article className="rounded-2xl bg-superficie p-4">
          <p className="text-sm opacity-80">8:00 a 10:00 · Salón 203</p>
          <h2 className="text-lg font-semibold">Cálculo diferencial</h2>
          <p className="mt-2 inline-block rounded-full bg-acento px-3 py-1 text-sm font-medium text-sobre-acento">
            Clase
          </p>
        </article>
        <article className="rounded-2xl bg-superficie p-4">
          <p className="text-sm opacity-80">Entrega mañana</p>
          <h2 className="text-lg font-semibold">Taller de física</h2>
          <p className="mt-2 inline-block rounded-full bg-alerta px-3 py-1 text-sm font-bold text-sobre-alerta">
            Próxima entrega
          </p>
        </article>
      </section>

      <button
        type="button"
        className="self-start rounded-xl bg-primario px-5 py-2.5 font-medium text-sobre-primario"
      >
        Agregar materia
      </button>
    </main>
  );
}
