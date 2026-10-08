import { Boton } from "@/components/boton";
import { Campo } from "@/components/campo";
import { headers } from "next/headers";
import { ActivarNotificaciones } from "@/components/activar-notificaciones";
import { EnlaceCalendario } from "@/components/enlace-calendario";
import { HistorialEquipos } from "@/components/historial-equipos";
import { InstalarApp } from "@/components/instalar-app";
import { correoConfigurado } from "@/lib/envios";
import { ANTICIPACIONES } from "@/lib/recordatorios";
import { Mensajes, type ParamsMensajes } from "@/components/mensajes";
import { SelectorTema } from "@/components/selector-tema";
import type { Perfil } from "@/lib/modelos";
import { formatoNota } from "@/lib/notas";
import { requerirUsuario, zonaDelUsuario } from "@/lib/sesion";
import { fechaHora } from "@/lib/zona";
import { MODO_POR_DEFECTO, TEMA_POR_DEFECTO } from "@/lib/temas/temas";
import { cambiarEnlaceCalendario, guardarPerfil } from "./acciones";
import { guardarAvisos } from "./avisos";

export default async function PaginaPerfil({ searchParams }: { searchParams: ParamsMensajes }) {
  const { supabase, usuario } = await requerirUsuario();
  const [{ data }, { data: dispositivos }, zona] = await Promise.all([
    supabase.from("perfiles").select("*").eq("id", usuario.id).maybeSingle(),
    supabase.from("dispositivos").select("*").order("ultimo_uso", { ascending: false }),
    zonaDelUsuario(supabase, usuario.id),
  ]);
  const equipos = (dispositivos ?? []).map((d) => ({
    id: d.id as string,
    clave: d.clave as string,
    nombre: d.nombre as string,
    instalada: fechaHora(d.instalada_en, zona),
    uso: fechaHora(d.ultimo_uso, zona),
  }));
  const perfil = data as Perfil | null;
  const h = await headers();
  const sitio = `${h.get("x-forwarded-proto") ?? "https"}://${h.get("host")}`;

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
      <InstalarApp />
      <section className="flex flex-col gap-3 rounded-2xl bg-superficie p-4 sm:p-6">
        <h2 className="text-lg font-semibold">Equipos con la app</h2>
        <HistorialEquipos equipos={equipos} />
      </section>
      <section className="flex flex-col gap-3 rounded-2xl bg-superficie p-4 sm:p-6">
        <h2 className="text-lg font-semibold">Ver la agenda en Google Calendar</h2>
        <p className="text-sm opacity-80">
          Tus clases, entregas pendientes y exámenes del semestre activo aparecen en Google Calendar (o el calendario
          del celular) y se actualizan solos. Google puede tardar unas horas en mostrar los cambios.
        </p>
        {perfil?.token_calendario ? (
          <>
            <EnlaceCalendario url={`${sitio}/api/calendario/${perfil.token_calendario}.ics`} />
            <details className="text-sm">
              <summary className="cursor-pointer">¿Compartiste el enlace sin querer?</summary>
              <form action={cambiarEnlaceCalendario} className="mt-2 flex flex-col gap-2">
                <p>Puedes cambiarlo. El enlace anterior deja de funcionar y tendrás que agregar el nuevo.</p>
                <Boton variante="peligro" className="self-start">
                  Cambiar enlace
                </Boton>
              </form>
            </details>
          </>
        ) : (
          <p className="text-sm">El enlace aparecerá cuando se actualice la base de datos.</p>
        )}
      </section>
      <form action={guardarAvisos} className="flex flex-col gap-3 rounded-2xl bg-superficie p-4 sm:p-6">
        <h2 className="text-lg font-semibold">Recordatorios</h2>
        <p className="text-sm opacity-80">Avisos antes de cada entrega pendiente y de cada examen con fecha.</p>
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-sm font-medium">Cuándo avisar</legend>
          <div className="flex flex-wrap gap-2">
            {ANTICIPACIONES.map((a) => (
              <label key={a.minutos} className="flex items-center gap-2 rounded-lg bg-fondo px-3 py-1.5 text-sm">
                <input
                  type="checkbox"
                  name="avisos_antes"
                  value={a.minutos}
                  defaultChecked={(perfil?.avisos_antes ?? [1440, 60]).includes(a.minutos)}
                  className="accent-primario"
                />
                {a.nombre}
              </label>
            ))}
          </div>
        </fieldset>
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-sm font-medium">Cómo avisar</legend>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="avisos_push" defaultChecked={perfil?.avisos_push ?? true} className="accent-primario" />
            Notificación en el celular o el computador
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="avisos_correo" defaultChecked={perfil?.avisos_correo ?? false} className="accent-primario" />
            Correo a {usuario.email}
            {!correoConfigurado() && <span className="opacity-70">(aún no configurado)</span>}
          </label>
        </fieldset>
        <ActivarNotificaciones />
        <Boton type="submit" className="self-start">
          Guardar recordatorios
        </Boton>
      </form>
    </>
  );
}
