"use client";

import { useState } from "react";
import { TEMAS, type TemaId } from "@/lib/temas/temas";

// Radios con los temas disponibles. Al cambiar, el tema se aplica de una
// vez como vista previa; se guarda cuando se envía el formulario.
export function SelectorTema({ inicial }: { inicial: TemaId }) {
  const [tema, setTema] = useState<TemaId>(inicial);

  function elegir(id: TemaId) {
    setTema(id);
    document.documentElement.dataset.tema = id;
  }

  return (
    <fieldset className="grid gap-3 sm:grid-cols-2">
      <legend className="mb-2 text-sm font-medium">Tema de color</legend>
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
