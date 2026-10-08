import type { InputHTMLAttributes } from "react";

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  etiqueta: string;
  name: string;
}

export function Campo({ etiqueta, className = "", ...props }: Props) {
  return (
    <label className={`flex flex-col gap-1 text-sm font-medium ${className}`}>
      {etiqueta}
      <input
        {...props}
        className="rounded-lg border border-texto/20 bg-fondo px-3 py-2 text-base font-normal outline-primario"
      />
    </label>
  );
}
