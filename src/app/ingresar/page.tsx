import { FormularioIngreso } from "./formulario";

export default async function Ingresar({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 p-4">
      <header className="degradado-tema rounded-2xl p-6 text-sobre-primario">
        <h1 className="text-2xl font-bold">Agenda Universitaria</h1>
        <p className="mt-1 opacity-90">Tus clases, tareas y notas en un solo lugar.</p>
      </header>
      {error === "enlace" && (
        <p role="alert" className="rounded-lg bg-alerta px-3 py-2 text-sm font-bold text-sobre-alerta">
          El enlace no es válido o ya venció. Inicia sesión o pide uno nuevo creando la cuenta otra vez.
        </p>
      )}
      <FormularioIngreso />
    </main>
  );
}
