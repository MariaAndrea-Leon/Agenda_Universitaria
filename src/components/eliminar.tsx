"use client";

import { useFormStatus } from "react-dom";
import { Boton } from "./boton";

function Contenido({ etiqueta, enlace, ariaLabel }: { etiqueta: string; enlace: boolean; ariaLabel?: string }) {
  const { pending } = useFormStatus();
  const texto = pending ? "Eliminando…" : etiqueta;
  return (
    <>
      {/* Marca que oculta la fila mientras se elimina (has-[[data-eliminando]]). */}
      {pending && <span data-eliminando hidden />}
      {enlace ? (
        <button type="submit" disabled={pending} aria-label={ariaLabel} className="text-xs underline disabled:no-underline">
          {texto}
        </button>
      ) : (
        <Boton variante="peligro" aria-label={ariaLabel}>
          {texto}
        </Boton>
      )}
    </>
  );
}

// Botón de eliminar que pregunta antes y muestra que está trabajando.
export function FormEliminar({
  action,
  campos,
  pregunta,
  etiqueta = "Eliminar",
  ariaLabel,
  enlace = false,
  className,
}: {
  action: (f: FormData) => Promise<void>;
  campos: Record<string, string>;
  pregunta: string;
  etiqueta?: string;
  ariaLabel?: string;
  enlace?: boolean;
  className?: string;
}) {
  return (
    <form
      action={action}
      className={className}
      onSubmit={(e) => {
        if (!window.confirm(pregunta)) e.preventDefault();
      }}
    >
      {Object.entries(campos).map(([nombre, valor]) => (
        <input key={nombre} type="hidden" name={nombre} value={valor} />
      ))}
      <Contenido etiqueta={etiqueta} enlace={enlace} ariaLabel={ariaLabel} />
    </form>
  );
}
