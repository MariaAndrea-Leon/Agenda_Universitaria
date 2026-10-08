"use client";

import { useEffect, useState, useTransition } from "react";
import { cambiarModo } from "@/lib/apariencia";

function esOscuroAhora(): boolean {
  const modo = document.documentElement.dataset.modo;
  if (modo === "oscuro") return true;
  if (modo === "claro") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

// Luna / sol en la barra: pasa al modo contrario del que se ve ahora y lo
// guarda en la cuenta.
export function BotonModo() {
  const [oscuro, setOscuro] = useState<boolean | null>(null);
  const [, empezar] = useTransition();

  useEffect(() => {
    setOscuro(esOscuroAhora());
    const consulta = window.matchMedia("(prefers-color-scheme: dark)");
    const alCambiar = () => setOscuro(esOscuroAhora());
    consulta.addEventListener("change", alCambiar);
    return () => consulta.removeEventListener("change", alCambiar);
  }, []);

  function alternar() {
    const nuevo = oscuro ? "claro" : "oscuro";
    document.documentElement.dataset.modo = nuevo;
    setOscuro(!oscuro);
    empezar(() => cambiarModo(nuevo));
  }

  const etiqueta = oscuro ? "Cambiar a modo claro" : "Cambiar a modo oscuro";
  return (
    <button
      type="button"
      onClick={alternar}
      aria-label={etiqueta}
      title={etiqueta}
      className="rounded-lg p-1.5 text-sobre-barra hover:bg-white/15"
    >
      {oscuro ? (
        <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
        </svg>
      )}
    </button>
  );
}
