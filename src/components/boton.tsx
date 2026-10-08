import type { ButtonHTMLAttributes } from "react";

type Variante = "primario" | "secundario" | "peligro";

const ESTILOS: Record<Variante, string> = {
  primario: "bg-primario text-sobre-primario",
  secundario: "bg-fondo text-texto border border-texto/20",
  peligro: "bg-alerta text-sobre-alerta font-bold",
};

export function Boton({
  variante = "primario",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variante?: Variante }) {
  return (
    <button
      {...props}
      className={`rounded-xl px-4 py-2 text-sm font-medium disabled:opacity-60 ${ESTILOS[variante]} ${className}`}
    />
  );
}
