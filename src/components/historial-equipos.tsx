"use client";

import { useEffect, useState } from "react";
import { claveDelEquipo } from "@/lib/instalacion";
import { FormEliminar } from "./eliminar";
import { quitarEquipo } from "@/app/(app)/perfil/acciones";

export interface Equipo {
  id: string;
  clave: string;
  nombre: string;
  instalada: string; // fecha ya formateada
  uso: string;
}

// Equipos donde se instaló o abrió la app, el más reciente primero.
export function HistorialEquipos({ equipos }: { equipos: Equipo[] }) {
  const [actual, setActual] = useState<string | null>(null);
  useEffect(() => setActual(claveDelEquipo()), []);

  if (equipos.length === 0) {
    return <p className="text-sm">Todavía no hay equipos. Aparecen aquí cuando instalas la app o la abres instalada.</p>;
  }
  return (
    <ul className="flex flex-col gap-2">
      {equipos.map((e) => (
        <li key={e.id} className="has-[[data-eliminando]]:hidden flex items-center gap-3 rounded-xl bg-fondo px-3 py-2">
          <span className="min-w-0 flex-1">
            <span className="font-medium">{e.nombre}</span>
            {e.clave === actual && <span className="ml-2 rounded-full bg-primario px-2 py-0.5 text-xs text-sobre-primario">Este equipo</span>}
            <span className="block text-sm">
              Instalada el {e.instalada} · último uso {e.uso}
            </span>
          </span>
          <FormEliminar
            action={quitarEquipo}
            campos={{ id: e.id }}
            pregunta={`¿Quitar ${e.nombre} del historial? La app no se desinstala de ese equipo.`}
            etiqueta="Quitar"
            ariaLabel={`Quitar ${e.nombre} del historial`}
            enlace
          />
        </li>
      ))}
    </ul>
  );
}
