import { formatoNota, type Resumen } from "@/lib/notas";

// Frase que explica cómo va la materia frente a la meta.
export function frasePara(r: Resumen, meta: number): string {
  const m = formatoNota(meta);
  const falta = `${formatoNota(r.restante, r.restante % 1 ? 1 : 0)} %`;
  switch (r.estado.tipo) {
    case "sin-notas":
      return `Aún no hay notas. Para llegar a ${m} necesitas promediar ${formatoNota(r.necesito ?? meta)}.`;
    case "necesita":
      return `Necesitas promediar ${formatoNota(r.estado.nota)} en el ${falta} que falta para llegar a ${m}.`;
    case "inalcanzable":
      return `Ya no alcanza para ${m}: necesitarías ${formatoNota(r.estado.nota)} en el ${falta} que falta.`;
    case "asegurada":
      return `Ya aseguraste ${m}: tienes ${formatoNota(r.acumulado, 2)} puntos de 5,0.`;
    case "terminada":
      return `Nota final ${formatoNota(r.acumulado, 2)}: ${r.estado.aprobada ? "llegaste a la meta" : `no llegó a ${m}`}.`;
  }
}

export function tonoDe(r: Resumen): "bien" | "alerta" | "neutro" {
  const t = r.estado.tipo;
  if (t === "asegurada" || (t === "terminada" && r.estado.aprobada)) return "bien";
  if (t === "inalcanzable" || t === "terminada" || (t === "necesita" && r.estado.nota > 4)) return "alerta";
  return "neutro";
}

export function Cifra({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div className="flex flex-col rounded-xl bg-fondo px-3 py-2">
      <span className="text-xs opacity-80">{etiqueta}</span>
      <span className="text-xl font-bold tabular-nums">{valor}</span>
    </div>
  );
}

export function ResumenNotas({ resumen: r, meta }: { resumen: Resumen; meta: number }) {
  const tono = tonoDe(r);
  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-3 gap-2">
        <Cifra etiqueta="Llevo" valor={r.llevo == null ? "—" : formatoNota(r.llevo, 2)} />
        <Cifra etiqueta="Acumulado" valor={formatoNota(r.acumulado, 2)} />
        <Cifra etiqueta="Calificado" valor={`${formatoNota(r.calificado, r.calificado % 1 ? 1 : 0)} %`} />
      </div>
      <p
        role="status"
        className={`rounded-xl px-3 py-2 text-sm font-medium ${
          tono === "bien"
            ? "bg-primario text-sobre-primario"
            : tono === "alerta"
              ? "bg-alerta text-sobre-alerta"
              : "bg-fondo"
        }`}
      >
        {frasePara(r, meta)}
      </p>
      {r.planeado < 100 && (
        <p className="text-sm opacity-80">
          El plan de evaluación suma {formatoNota(r.planeado, r.planeado % 1 ? 1 : 0)} %. Lo que falta se cuenta como
          pendiente.
        </p>
      )}
    </div>
  );
}
