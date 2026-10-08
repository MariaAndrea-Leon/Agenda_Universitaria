"use client";

import { useState } from "react";
import { Boton } from "./boton";

// Enlace privado de suscripción al calendario, con botón para copiarlo.
export function EnlaceCalendario({ url }: { url: string }) {
  const [copiado, setCopiado] = useState(false);
  const webcal = url.replace(/^https?:/, "webcal:");
  const google = `https://calendar.google.com/calendar/r?cid=${encodeURIComponent(webcal)}`;

  async function copiar() {
    try {
      await navigator.clipboard.writeText(url);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    } catch {
      setCopiado(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <label className="flex flex-col gap-1 text-sm font-medium">
        Enlace privado
        <input
          readOnly
          value={url}
          onFocus={(e) => e.currentTarget.select()}
          className="rounded-lg border border-texto/20 bg-fondo px-3 py-2 font-mono text-xs"
        />
      </label>
      <div className="flex flex-wrap items-center gap-2">
        <a href={google} target="_blank" rel="noopener noreferrer" className="rounded-xl bg-primario px-4 py-2 text-sm font-medium text-sobre-primario">
          Agregar a Google Calendar
        </a>
        <Boton type="button" variante="secundario" onClick={copiar}>
          {copiado ? "Copiado" : "Copiar enlace"}
        </Boton>
        <a href={webcal} className="text-sm underline">
          Abrir en el calendario del celular
        </a>
      </div>
      <p role="status" className="sr-only">
        {copiado ? "Enlace copiado" : ""}
      </p>
    </div>
  );
}
