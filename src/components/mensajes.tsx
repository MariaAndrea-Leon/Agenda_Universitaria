// Muestra el ?error= o ?ok= que dejan las acciones al redirigir.
export function Mensajes({ error, ok }: { error?: string; ok?: string }) {
  if (error) {
    return (
      <p role="alert" className="rounded-lg bg-alerta px-3 py-2 text-sm font-bold text-sobre-alerta">
        {error}
      </p>
    );
  }
  if (ok) {
    return (
      <p role="status" className="rounded-lg bg-acento px-3 py-2 text-sm text-sobre-acento">
        {ok}
      </p>
    );
  }
  return null;
}

export type ParamsMensajes = Promise<{ error?: string; ok?: string }>;
