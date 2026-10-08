"use client";

import type { ButtonHTMLAttributes } from "react";
import { useFormStatus } from "react-dom";

type Variante = "primario" | "secundario" | "peligro";

const ESTILOS: Record<Variante, string> = {
  primario: "bg-primario text-sobre-primario",
  secundario: "bg-fondo text-texto border border-texto/20",
  peligro: "bg-alerta text-sobre-alerta font-bold",
};

// Mientras el formulario se envía, el botón se desactiva y avisa que está
// trabajando, para que no parezca que no pasó nada.
export function Boton({
  variante = "primario",
  className = "",
  disabled,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variante?: Variante }) {
  const { pending } = useFormStatus();
  const enviando = pending && props.type !== "button";
  return (
    <button
      {...props}
      disabled={disabled || enviando}
      aria-busy={enviando || undefined}
      className={`rounded-xl px-4 py-2 text-sm font-medium disabled:opacity-60 ${enviando ? "cursor-wait" : ""} ${ESTILOS[variante]} ${className}`}
    />
  );
}
