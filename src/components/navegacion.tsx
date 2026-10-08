"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { BotonModo } from "./boton-modo";

type Icono = "hoy" | "calendario" | "tareas" | "notas" | "mas";

const ENLACES = [
  { href: "/hoy", nombre: "Hoy", icono: "hoy" as Icono },
  { href: "/calendario", nombre: "Calendario", icono: "calendario" as Icono },
  { href: "/tareas", nombre: "Tareas", icono: "tareas" as Icono },
  { href: "/evaluaciones", nombre: "Exámenes" },
  { href: "/notas", nombre: "Notas", icono: "notas" as Icono },
  { href: "/horario", nombre: "Horario" },
  { href: "/materias", nombre: "Materias" },
  { href: "/semestres", nombre: "Semestres" },
  { href: "/perfil", nombre: "Perfil" },
];

// En el celular, la barra de abajo lleva los cuatro con ícono y "Más" el resto.
const PRINCIPALES = ENLACES.filter((e) => e.icono);
const SECUNDARIOS = ENLACES.filter((e) => !e.icono);

const TRAZOS: Record<Icono, string> = {
  hoy: "M12 3v2M12 19v2M5 12H3M21 12h-2M6.3 6.3 4.9 4.9M19.1 19.1l-1.4-1.4M6.3 17.7l-1.4 1.4M19.1 4.9l-1.4 1.4M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z",
  calendario: "M4 6h16v14H4zM4 10h16M8 3v4M16 3v4",
  tareas: "M9 6h11M9 12h11M9 18h11M4 6l1 1 2-2M4 12l1 1 2-2M4 18l1 1 2-2",
  notas: "M4 20V10M10 20V4M16 20v-7M22 20H2",
  mas: "M5 12h.01M12 12h.01M19 12h.01",
};

function Glifo({ icono }: { icono: Icono }) {
  return (
    <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={TRAZOS[icono]} />
    </svg>
  );
}

function SalirForm({ className }: { className: string }) {
  return (
    <form action="/auth/salir" method="post">
      <button type="submit" className={className}>
        Salir
      </button>
    </form>
  );
}

export function Navegacion() {
  const ruta = usePathname();
  const [masAbierto, setMasAbierto] = useState(false);
  const idMenu = useId();
  const menu = useRef<HTMLDivElement>(null);
  const esActivo = (href: string) => ruta === href || ruta.startsWith(`${href}/`);
  const masActivo = SECUNDARIOS.some((e) => esActivo(e.href));

  // El menú "Más" se cierra al cambiar de página o con Escape.
  useEffect(() => setMasAbierto(false), [ruta]);
  useEffect(() => {
    if (!masAbierto) return;
    menu.current?.querySelector("a")?.focus();
    const alTeclear = (e: KeyboardEvent) => e.key === "Escape" && setMasAbierto(false);
    window.addEventListener("keydown", alTeclear);
    return () => window.removeEventListener("keydown", alTeclear);
  }, [masAbierto]);

  return (
    <>
      {/* Computador y tableta: todo en la barra de arriba. */}
      <nav className="hidden flex-wrap items-center gap-1 sm:flex" aria-label="Principal">
        {ENLACES.map((e) => (
          <Link
            key={e.href}
            href={e.href}
            aria-current={esActivo(e.href) ? "page" : undefined}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
              esActivo(e.href) ? "bg-fondo text-texto" : "text-sobre-barra hover:bg-white/15"
            }`}
          >
            {e.nombre}
          </Link>
        ))}
        <div className="ml-auto flex items-center gap-1">
          <BotonModo />
          <SalirForm className="rounded-lg px-3 py-1.5 text-sm text-sobre-barra hover:bg-white/15" />
        </div>
      </nav>

      {/* Celular: modo en la barra de arriba y navegación abajo. */}
      <div className="ml-auto sm:hidden">
        <BotonModo />
      </div>
      <nav
        className="fixed inset-x-0 bottom-0 z-20 border-t border-white/10 bg-barra pb-[env(safe-area-inset-bottom)] sm:hidden"
        aria-label="Principal"
      >
        {masAbierto && (
          <div
            id={idMenu}
            ref={menu}
            className="absolute inset-x-2 bottom-full mb-2 flex flex-col gap-1 rounded-2xl bg-superficie p-2 text-texto shadow-lg"
          >
            {SECUNDARIOS.map((e) => (
              <Link
                key={e.href}
                href={e.href}
                aria-current={esActivo(e.href) ? "page" : undefined}
                className={`rounded-xl px-4 py-3 font-medium ${esActivo(e.href) ? "bg-primario text-sobre-primario" : "hover:bg-fondo"}`}
              >
                {e.nombre}
              </Link>
            ))}
            <SalirForm className="w-full rounded-xl px-4 py-3 text-left font-medium hover:bg-fondo" />
          </div>
        )}
        <ul className="grid grid-cols-5">
          {PRINCIPALES.map((e) => (
            <li key={e.href}>
              <Link
                href={e.href}
                aria-current={esActivo(e.href) ? "page" : undefined}
                className="flex flex-col items-center gap-0.5 py-2 text-xs font-medium text-sobre-barra"
              >
                <span className={`rounded-full px-4 py-0.5 ${esActivo(e.href) ? "bg-fondo text-texto" : ""}`}>
                  <Glifo icono={e.icono!} />
                </span>
                {e.nombre}
              </Link>
            </li>
          ))}
          <li>
            <button
              type="button"
              aria-expanded={masAbierto}
              aria-controls={idMenu}
              onClick={() => setMasAbierto((v) => !v)}
              className="flex w-full flex-col items-center gap-0.5 py-2 text-xs font-medium text-sobre-barra"
            >
              <span className={`rounded-full px-4 py-0.5 ${masActivo || masAbierto ? "bg-fondo text-texto" : ""}`}>
                <Glifo icono="mas" />
              </span>
              Más
            </button>
          </li>
        </ul>
      </nav>
    </>
  );
}
