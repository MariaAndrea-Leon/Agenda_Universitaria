import { Navegacion } from "@/components/navegacion";
import { requerirUsuario } from "@/lib/sesion";

export default async function LayoutApp({ children }: { children: React.ReactNode }) {
  await requerirUsuario();

  return (
    <div className="min-h-dvh">
      <header className="bg-barra px-4 py-3">
        <div className="mx-auto flex max-w-5xl items-center gap-2 sm:gap-6">
          <p className="font-bold text-sobre-barra">Agenda Universitaria</p>
          <div className="flex flex-1 items-center">
            <Navegacion />
          </div>
        </div>
      </header>
      <main className="mx-auto flex max-w-5xl flex-col gap-6 p-4 pb-28 sm:p-6">{children}</main>
    </div>
  );
}
