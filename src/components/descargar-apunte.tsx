"use client";

import { ANCHO, type Dibujo, fondoDe } from "@/lib/pizarron";
import { pintarTodo } from "./editor-pizarron";

// Descarga un apunte como imagen PNG.
export function DescargarApunte({ dibujo, fondo, nombre }: { dibujo: Dibujo; fondo: string; nombre: string }) {
  const descargar = () => {
    const c = document.createElement("canvas");
    const factor = 1.5;
    c.width = ANCHO * factor;
    c.height = dibujo.alto * factor;
    pintarTodo(c.getContext("2d")!, dibujo, fondoDe(fondo), factor);
    c.toBlob((blob) => {
      if (!blob) return;
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${nombre.replace(/[\\/:*?"<>|]/g, "")}.png`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    });
  };
  return (
    <button type="button" onClick={descargar} className="self-start rounded-xl border border-texto/20 bg-fondo px-4 py-2 text-sm font-medium">
      Descargar imagen
    </button>
  );
}
