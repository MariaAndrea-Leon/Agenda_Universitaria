"use client";

import { useEffect, useState } from "react";
import { Boton } from "./boton";
import { EVENTO_INSTALABLE } from "./registrar-sw";

type Caso = "cargando" | "instalada" | "boton" | "iphone" | "manual";

function casoActual(): Caso {
  if (window.matchMedia("(display-mode: standalone)").matches) return "instalada";
  if (window.__eventoInstalar) return "boton";
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/.test(ua) || (ua.includes("Macintosh") && navigator.maxTouchPoints > 1)) return "iphone";
  return "manual";
}

export function InstalarApp() {
  const [caso, setCaso] = useState<Caso>("cargando");

  useEffect(() => {
    const actualizar = () => setCaso(casoActual());
    actualizar();
    window.addEventListener(EVENTO_INSTALABLE, actualizar);
    return () => window.removeEventListener(EVENTO_INSTALABLE, actualizar);
  }, []);

  async function instalar() {
    const evento = window.__eventoInstalar;
    if (!evento) return;
    await evento.prompt();
    const { outcome } = await evento.userChoice;
    if (outcome === "accepted") window.__eventoInstalar = null;
    setCaso(casoActual());
  }

  return (
    <section className="flex flex-col gap-2 rounded-2xl bg-superficie p-4 sm:p-6">
      <h2 className="text-lg font-semibold">App en el celular</h2>
      {caso === "instalada" && <p className="text-sm">Ya estás usando la app instalada.</p>}
      {caso === "boton" && (
        <>
          <p className="text-sm">Instala la agenda en este dispositivo para abrirla desde la pantalla de inicio.</p>
          <Boton type="button" onClick={instalar} className="self-start">
            Instalar app
          </Boton>
        </>
      )}
      {caso === "iphone" && (
        <p className="text-sm">
          En iPhone o iPad, abre la agenda en Safari, toca <strong>Compartir</strong> y luego{" "}
          <strong>Agregar a inicio</strong>.
        </p>
      )}
      {caso === "manual" && (
        <p className="text-sm">
          Abre la agenda desde el celular y, en el menú del navegador, elige <strong>Instalar app</strong> o{" "}
          <strong>Agregar a la pantalla de inicio</strong>.
        </p>
      )}
    </section>
  );
}
