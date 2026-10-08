"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BotonModo } from "./boton-modo";

const ENLACES = [
  { href: "/horario", nombre: "Horario" },
  { href: "/materias", nombre: "Materias" },
  { href: "/semestres", nombre: "Semestres" },
  { href: "/perfil", nombre: "Perfil" },
];

export function Navegacion() {
  const ruta = usePathname();

  return (
    <nav className="flex flex-wrap items-center gap-1" aria-label="Principal">
      {ENLACES.map((e) => {
        const activo = ruta === e.href || ruta.startsWith(`${e.href}/`);
        return (
          <Link
            key={e.href}
            href={e.href}
            aria-current={activo ? "page" : undefined}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
              activo ? "bg-fondo text-texto" : "text-sobre-barra hover:bg-white/15"
            }`}
          >
            {e.nombre}
          </Link>
        );
      })}
      <div className="ml-auto flex items-center gap-1">
        <BotonModo />
        <form action="/auth/salir" method="post">
          <button type="submit" className="rounded-lg px-3 py-1.5 text-sm text-sobre-barra hover:bg-white/15">
            Salir
          </button>
        </form>
      </div>
    </nav>
  );
}
