import Link from "next/link";
import { DescargarApunte } from "@/components/descargar-apunte";
import { DibujoSvg } from "@/components/dibujo-svg";
import { volverCon } from "@/lib/acciones";
import { COLUMNAS_COMPARTIDO, type Compartido, deQuien } from "@/lib/compartidos";
import type { Apunte } from "@/lib/modelos";
import { fondoDe, leerDibujo } from "@/lib/pizarron";
import { requerirUsuario } from "@/lib/sesion";
import { diaLargo } from "@/lib/zona";

// Un apunte compartido contigo: se ve completo, sin editar.
export default async function PaginaApunteCompartido({ params }: { params: Promise<{ apunte: string }> }) {
  const { apunte: id } = await params;
  const { supabase, usuario } = await requerirUsuario();
  const { data } = await supabase
    .from("apuntes_compartidos")
    .select(COLUMNAS_COMPARTIDO)
    .eq("destinatario_id", usuario.id)
    .eq("apunte_id", id)
    .maybeSingle();
  const c = data as unknown as Compartido | null;
  if (!c?.apuntes) volverCon("/compartidos", "error", "Ese apunte ya no está compartido contigo.");
  const a = c.apuntes as Apunte;
  const dibujo = leerDibujo(a.dibujo);
  const titulo = a.titulo || "Apunte de clase";

  return (
    <>
      <Link href="/compartidos" className="text-sm underline">
        Compartidos conmigo
      </Link>
      <div>
        <h1 className="text-2xl font-bold">{titulo}</h1>
        <p className="text-sm">
          {c.materia_nombre} · <span className="first-letter:uppercase">{diaLargo(a.fecha)}</span> · De {deQuien(c)}
        </p>
      </div>
      <div className="overflow-hidden rounded-xl border border-texto/15">
        <DibujoSvg dibujo={dibujo} fondo={fondoDe(a.fondo)} alto={dibujo.alto} className="block h-auto w-full" />
      </div>
      <DescargarApunte dibujo={dibujo} fondo={a.fondo} nombre={`${titulo} ${a.fecha}`} />
    </>
  );
}
