"use client";

import { useEffect, useState } from "react";
import { CLAVE_TEMA } from "@/lib/temas/css";
import { TEMAS, TEMA_POR_DEFECTO, esTemaId, type TemaId } from "@/lib/temas/temas";

// Por ahora el tema se guarda en el navegador; en la fase 1 pasa al perfil
// del usuario (columna perfiles.tema) para que se sincronice entre equipos.
export function SelectorTema() {
  const [tema, setTema] = useState<TemaId>(TEMA_POR_DEFECTO);

  useEffect(() => {
    const actual = document.documentElement.dataset.tema;
    if (esTemaId(actual)) setTema(actual);
  }, []);

  function elegir(id: TemaId) {
    setTema(id);
    document.documentElement.dataset.tema = id;
    try {
      localStorage.setItem(CLAVE_TEMA, id);
    } catch {
      // Sin almacenamiento (modo privado): el tema dura solo esta visita.
    }
  }

  return (
    <fieldset className="grid gap-3 sm:grid-cols-2">
      <legend className="mb-2 font-semibold">Tema de color</legend>
      {Object.values(TEMAS).map((t) => (
        <label
          key={t.id}
          className={`flex cursor-pointer items-center gap-3 rounded-xl border-2 bg-fondo p-3 ${
            tema === t.id ? "border-primario" : "border-transparent"
          }`}
        >
          <input
            type="radio"
            name="tema"
            value={t.id}
            checked={tema === t.id}
            onChange={() => elegir(t.id)}
            className="accent-primario"
          />
          <span className="flex -space-x-1" aria-hidden>
            {[t.colores.superficie, t.colores.acento, t.colores.alerta, t.colores.primario, t.colores.texto].map(
              (color) => (
                <span
                  key={color}
                  className="size-5 rounded-full border border-white"
                  style={{ backgroundColor: color }}
                />
              ),
            )}
          </span>
          <span>
            <span className="block font-medium">{t.nombre}</span>
            <span className="block text-sm opacity-80">{t.descripcion}</span>
          </span>
        </label>
      ))}
    </fieldset>
  );
}
