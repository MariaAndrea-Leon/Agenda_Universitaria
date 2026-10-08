"use client";

import { useState } from "react";
import { MODOS, TEMAS, TEMA_OSCURO, type Modo, type Tema, type TemaId } from "@/lib/temas/temas";

function Muestras({ tema }: { tema: Tema }) {
  const c = tema.colores;
  return (
    <span className="flex -space-x-1" aria-hidden>
      {[c.fondo, c.superficie, c.acento, c.alerta, c.primario, c.texto].map((color, i) => (
        <span key={i} className="size-5 rounded-full border border-white/70" style={{ backgroundColor: color }} />
      ))}
    </span>
  );
}

const ESTILO_OPCION = "flex cursor-pointer items-center gap-3 rounded-xl border-2 bg-fondo p-3";

// Modo (claro, oscuro, según el dispositivo) y tema del modo claro. Al
// cambiar se aplican de una vez como vista previa; se guardan al enviar.
export function SelectorTema({ inicial, modoInicial }: { inicial: TemaId; modoInicial: Modo }) {
  const [tema, setTema] = useState<TemaId>(inicial);
  const [modo, setModo] = useState<Modo>(modoInicial);

  return (
    <div className="flex flex-col gap-5">
      <fieldset className="grid gap-3 sm:grid-cols-3">
        <legend className="mb-2 text-sm font-medium">Modo</legend>
        {MODOS.map((m) => (
          <label key={m.id} className={`${ESTILO_OPCION} ${modo === m.id ? "border-primario" : "border-transparent"}`}>
            <input
              type="radio"
              name="modo"
              value={m.id}
              checked={modo === m.id}
              onChange={() => {
                setModo(m.id);
                document.documentElement.dataset.modo = m.id;
              }}
              className="accent-primario"
            />
            <span className="font-medium">{m.nombre}</span>
          </label>
        ))}
      </fieldset>

      <fieldset className="grid gap-3 sm:grid-cols-2">
        <legend className="mb-2 text-sm font-medium">Tema del modo claro</legend>
        {Object.values(TEMAS).map((t) => (
          <label key={t.id} className={`${ESTILO_OPCION} ${tema === t.id ? "border-primario" : "border-transparent"}`}>
            <input
              type="radio"
              name="tema"
              value={t.id}
              checked={tema === t.id}
              onChange={() => {
                setTema(t.id as TemaId);
                document.documentElement.dataset.tema = t.id;
              }}
              className="accent-primario"
            />
            <Muestras tema={t} />
            <span>
              <span className="block font-medium">{t.nombre}</span>
              <span className="block text-sm opacity-80">{t.descripcion}</span>
            </span>
          </label>
        ))}
      </fieldset>

      <div className="flex items-center gap-3 text-sm">
        <Muestras tema={TEMA_OSCURO} />
        <span>
          El modo oscuro usa el tema <span className="font-medium">{TEMA_OSCURO.nombre}</span>.
        </span>
      </div>
    </div>
  );
}
