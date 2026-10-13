import { FormularioIngreso } from "./formulario";

export default async function Ingresar({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; ok?: string }>;
}) {
  const { error, ok } = await searchParams;

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 p-4">
      <header className="degradado-tema rounded-2xl p-6 text-sobre-barra">
        <h1 className="text-2xl font-bold">Agenda Universitaria</h1>
        <p className="mt-1 opacity-90">Tus clases, tareas y notas en un solo lugar.</p>
      </header>
      {error === "enlace" && (
        <p role="alert" className="rounded-lg bg-alerta px-3 py-2 text-sm font-bold text-sobre-alerta">
          El enlace no es válido o ya venció. Inicia sesión o pide uno nuevo creando la cuenta otra vez.
        </p>
      )}
      {ok === "cuenta-eliminada" && (
        <p role="status" className="rounded-lg bg-acento px-3 py-2 text-sm text-sobre-acento">
          Tu cuenta y todos tus datos fueron eliminados.
        </p>
      )}
      <FormularioIngreso />
      <p className="text-center text-sm">
        <a href="/privacidad" className="underline">
          Política de privacidad
        </a>
      </p>
    </main>
  );
}
