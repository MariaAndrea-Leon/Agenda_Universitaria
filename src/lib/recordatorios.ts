// Qué avisos hay que mandar en una pasada del programador de recordatorios.
//
// El programador corre cada pocos minutos y revisa una ventana hacia atrás
// (por si una pasada se retrasa o falla). Cada aviso tiene un momento de
// envío = fecha del pendiente − anticipación; se manda si ese momento cae en
// la ventana y si no se envió antes (eso lo decide el registro en la base).

export const ANTICIPACIONES = [
  { minutos: 10080, nombre: "1 semana antes" },
  { minutos: 2880, nombre: "2 días antes" },
  { minutos: 1440, nombre: "1 día antes" },
  { minutos: 180, nombre: "3 horas antes" },
  { minutos: 60, nombre: "1 hora antes" },
  { minutos: 30, nombre: "30 minutos antes" },
] as const;

export const VENTANA_MINUTOS = 120;

export interface Pendiente {
  tipo: "tarea" | "evaluacion";
  id: string;
  usuarioId: string;
  titulo: string;
  materia: string;
  cuando: string; // ISO de la entrega o del examen
}

export interface Aviso extends Pendiente {
  enviarEn: string; // ISO
  minutosAntes: number;
}

export function avisosPorEnviar(pendientes: Pendiente[], antes: number[], ahora: Date, ventana = VENTANA_MINUTOS): Aviso[] {
  const desde = ahora.getTime() - ventana * 60_000;
  const hasta = ahora.getTime();
  const avisos: Aviso[] = [];
  for (const p of pendientes) {
    const momento = new Date(p.cuando).getTime();
    if (momento <= hasta) continue; // ya pasó: no tiene sentido avisar
    // Si hay varias anticipaciones vencidas en la ventana, solo la más cercana.
    const vencidas = antes
      .map((m) => ({ m, enviar: momento - m * 60_000 }))
      .filter((x) => x.enviar > desde && x.enviar <= hasta)
      .sort((a, b) => a.m - b.m);
    if (vencidas.length > 0) {
      avisos.push({ ...p, enviarEn: new Date(vencidas[0].enviar).toISOString(), minutosAntes: vencidas[0].m });
    }
  }
  return avisos;
}

export function textoAnticipacion(minutos: number): string {
  if (minutos % 1440 === 0) return minutos === 1440 ? "mañana" : `en ${minutos / 1440} días`;
  if (minutos % 60 === 0) return minutos === 60 ? "en 1 hora" : `en ${minutos / 60} horas`;
  return `en ${minutos} minutos`;
}

export function mensajeDe(a: Aviso): { titulo: string; cuerpo: string; url: string } {
  const que = a.tipo === "tarea" ? "Entrega" : "Evaluación";
  return {
    titulo: `${que} ${textoAnticipacion(a.minutosAntes)}: ${a.titulo}`,
    cuerpo: a.materia,
    url: a.tipo === "tarea" ? "/tareas" : "/evaluaciones",
  };
}
