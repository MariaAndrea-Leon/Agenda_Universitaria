import Link from "next/link";
import { redirect } from "next/navigation";
import { crearClienteServidor } from "@/lib/supabase/servidor";

export default async function Inicio() {
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/hoy");

  return (
    <main className="mx-auto flex min-h-dvh max-w-3xl flex-col justify-center gap-6 p-4 sm:p-8">
      <header className="degradado-tema rounded-2xl p-8 text-sobre-barra">
        <h1 className="text-3xl font-bold sm:text-4xl">Agenda Universitaria</h1>
        <p className="mt-2 text-lg opacity-90">
          Tu horario, tareas, exámenes y notas de la universidad en un solo lugar.
        </p>
      </header>
      <ul className="grid gap-3 sm:grid-cols-3">
        {[
          ["Horario semanal", "Materias con color, salón y aviso si se cruzan."],
          ["Tareas y exámenes", "Todo lo que tienes que entregar, por fecha."],
          ["Notas y promedio", "Escala de 0 a 5 y cuánto necesitas para pasar."],
        ].map(([titulo, texto]) => (
          <li key={titulo} className="rounded-2xl bg-superficie p-4">
            <p className="font-semibold">{titulo}</p>
            <p className="text-sm opacity-80">{texto}</p>
          </li>
        ))}
      </ul>
      <Link
        href="/ingresar"
        className="self-start rounded-xl bg-primario px-5 py-2.5 font-medium text-sobre-primario"
      >
        Entrar o crear cuenta
      </Link>
    </main>
  );
}
