"use client";

import { useEffect, useState } from "react";
import { comoAbrir } from "@/lib/dispositivo";
import { enModoApp, instaladaSegunNavegador, marcarInstalada, pareceInstalada, registrarEquipo } from "@/lib/instalacion";
import { Boton } from "./boton";
import { EVENTO_INSTALABLE } from "./registrar-sw";

// en-app: se está usando la app instalada.
// instalar: el navegador ofrece instalarla con un toque.
// instalada: ya está instalada en este equipo; el botón la abre.
// manual: el navegador no ofrece el aviso; el botón explica cómo.
type Caso = "cargando" | "en-app" | "instalar" | "instalada" | "manual";

async function casoActual(): Promise<Caso> {
  if (enModoApp()) return "en-app";
  if (window.__eventoInstalar) return "instalar";
  if (pareceInstalada() || (await instaladaSegunNavegador())) return "instalada";
  return "manual";
}

function pasosParaInstalar(): string {
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/.test(ua) || (ua.includes("Macintosh") && navigator.maxTouchPoints > 1)) {
    return "En Safari, toca Compartir (el cuadro con la flecha) y luego «Agregar a inicio».";
  }
  if (/Firefox\//.test(ua)) {
    return /Android/.test(ua)
      ? "Abre el menú ⋮ y elige «Instalar» o «Agregar a la pantalla de inicio»."
      : "Firefox de computador no instala apps web. Abre la agenda en Chrome o Edge y vuelve a tocar este botón.";
  }
  if (/Safari\//.test(ua) && !/Chrome\/|Edg\//.test(ua)) {
    return "En Safari del Mac, abre el menú Archivo y elige «Agregar al Dock».";
  }
  if (/Android/.test(ua)) return "Abre el menú ⋮ del navegador y elige «Instalar app» o «Agregar a la pantalla de inicio».";
  return "Abre el menú del navegador (⋮ o …) y elige «Instalar Agenda Universitaria» o «Aplicaciones > Instalar este sitio como aplicación».";
}

export function InstalarApp() {
  const [caso, setCaso] = useState<Caso>("cargando");
  const [ayuda, setAyuda] = useState("");

  useEffect(() => {
    const actualizar = () => casoActual().then(setCaso);
    actualizar();
    window.addEventListener(EVENTO_INSTALABLE, actualizar);
    return () => window.removeEventListener(EVENTO_INSTALABLE, actualizar);
  }, []);

  async function instalar() {
    const evento = window.__eventoInstalar;
    if (!evento) {
      setAyuda(pasosParaInstalar());
      return;
    }
    await evento.prompt();
    const { outcome } = await evento.userChoice;
    if (outcome === "accepted") {
      window.__eventoInstalar = null;
      marcarInstalada(true);
      registrarEquipo(true).catch(() => {});
      setAyuda("Listo. La agenda quedó instalada en este equipo.");
    }
    setCaso(await casoActual());
  }

  async function abrir() {
    const ua = navigator.userAgent;
    setAyuda(comoAbrir(ua, navigator.maxTouchPoints));
    // En Chrome y Edge de computador, si el navegador confirma que está
    // instalada, este enlace abre la ventana de la app.
    if (/Chrome\/|Edg\//.test(ua) && !/Android|Mobile/.test(ua) && (await instaladaSegunNavegador())) {
      window.open("web+agenda://hoy", "_blank", "noopener");
    }
  }

  return (
    <section className="flex flex-col gap-2 rounded-2xl bg-superficie p-4 sm:p-6">
      <h2 className="text-lg font-semibold">App en este equipo</h2>
      {caso === "en-app" ? (
        <p className="text-sm">Estás usando la app instalada en este equipo.</p>
      ) : (
        <>
          <p className="text-sm">
            {caso === "instalada"
              ? "La agenda ya está instalada en este equipo."
              : "Instala la agenda en este equipo para abrirla como una app, desde su propio ícono."}
          </p>
          <div className="flex flex-wrap items-center gap-3">
            {caso === "instalada" ? (
              <>
                <Boton type="button" onClick={abrir}>
                  Abrir la app
                </Boton>
                <button type="button" onClick={instalar} className="text-sm underline">
                  ¿La desinstalaste? Instálala de nuevo
                </button>
              </>
            ) : (
              <Boton type="button" onClick={instalar} disabled={caso === "cargando"}>
                Instalar app
              </Boton>
            )}
          </div>
        </>
      )}
      <p className="text-sm" role="status" aria-live="polite">
        {ayuda}
      </p>
    </section>
  );
}
