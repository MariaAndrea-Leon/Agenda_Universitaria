import { Boton } from "@/components/boton";
import { Campo } from "@/components/campo";
import { Mensajes, type ParamsMensajes } from "@/components/mensajes";
import { SelectorTema } from "@/components/selector-tema";
import type { Perfil } from "@/lib/modelos";
import { formatoNota } from "@/lib/notas";
import { requerirUsuario } from "@/lib/sesion";
import { MODO_POR_DEFECTO, TEMA_POR_DEFECTO } from "@/lib/temas/temas";
import { guardarPerfil } from "./acciones";

export default async function PaginaPerfil({ searchParams }: { searchParams: ParamsMensajes }) {
  const { supabase, usuario } = await requerirUsuario();
  const { data } = await supabase.from("perfiles").select("*").eq("id", usuario.id).maybeSingle();
  const perfil = data as Perfil | null;

  return (
    <>
      <h1 className="text-2xl font-bold">Perfil</h1>
      <Mensajes {...await searchParams} />
      <form action={guardarPerfil} className="flex flex-col gap-4 rounded-2xl bg-superficie p-4 sm:p-6">
        <p className="text-sm opacity-80">{usuario.email}</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo etiqueta="Nombre" name="nombre" defaultValue={perfil?.nombre ?? ""} autoComplete="name" />
          <Campo etiqueta="Universidad" name="universidad" defaultValue={perfil?.universidad ?? ""} />
          <Campo etiqueta="Carrera" name="carrera" defaultValue={perfil?.carrera ?? ""} />
          <Campo
            etiqueta="Nota mínima para aprobar"
            name="nota_aprobatoria"
            inputMode="decimal"
            pattern="[0-5]([,.][0-9])?"
            title="Una nota de 0,0 a 5,0"
            defaultValue={formatoNota(Number(perfil?.nota_aprobatoria ?? 3))}
          />
        </div>
        <SelectorTema inicial={perfil?.tema ?? TEMA_POR_DEFECTO} modoInicial={perfil?.modo ?? MODO_POR_DEFECTO} />
        <Boton type="submit" className="self-start">
          Guardar
        </Boton>
      </form>
    </>
  );
}
