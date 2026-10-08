import Link from "next/link";
import { Boton } from "@/components/boton";
import { DibujoSvg } from "@/components/dibujo-svg";
import type { Apunte } from "@/lib/modelos";
import { fondoDe, leerDibujo } from "@/lib/pizarron";
import { diaLargo } from "@/lib/zona";
import { crearApunte } from "@/app/(app)/materias/apuntes";

// Apuntes de clase de una materia, del más reciente al más antiguo.
export function Pizarron({ materiaId, apuntes }: { materiaId: string; apuntes: Apunte[] }) {
  return (
    <section id="pizarron" className="flex flex-col gap-4 rounded-2xl bg-superficie p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Pizarrón</h2>
        <form action={crearApunte}>
          <input type="hidden" name="materia_id" value={materiaId} />
          <Boton type="submit">Nuevo apunte</Boton>
        </form>
      </div>

      {apuntes.length === 0 ? (
        <p className="text-sm">
          Todavía no hay apuntes. Escribe a mano con el dedo o el lápiz de la tablet, o con el teclado, sobre una pizarra o
          una hoja cuadriculada.
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {apuntes.map((a) => (
            <li key={a.id}>
              <Link
                href={`/materias/${materiaId}/apuntes/${a.id}`}
                className="flex flex-col overflow-hidden rounded-xl border border-texto/15 bg-fondo"
              >
                <DibujoSvg dibujo={leerDibujo(a.dibujo)} fondo={fondoDe(a.fondo)} alto={700} className="aspect-[10/7] w-full" />
                <span className="px-3 py-2">
                  <span className="block truncate font-medium">{a.titulo || "Apunte de clase"}</span>
                  <span className="block text-sm first-letter:uppercase">{diaLargo(a.fecha)}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
