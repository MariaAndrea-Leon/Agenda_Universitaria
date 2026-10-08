import { diaEnZona, diasEntre } from "@/lib/zona";

interface ConEntrega {
  entrega: string;
  completada_en: string | null;
}

export interface Grupos<T> {
  vencidas: T[];
  hoy: T[];
  semana: T[]; // de mañana a 7 días
  despues: T[];
  hechas: T[];
}

// Reparte las tareas en grupos según su fecha de entrega en la zona del
// estudiante. Cada grupo queda ordenado por entrega (las hechas, de la más
// reciente a la más antigua).
export function agruparTareas<T extends ConEntrega>(tareas: T[], ahora: Date, zona: string): Grupos<T> {
  const grupos: Grupos<T> = { vencidas: [], hoy: [], semana: [], despues: [], hechas: [] };
  const hoy = diaEnZona(ahora, zona);
  const ordenadas = [...tareas].sort((a, b) => a.entrega.localeCompare(b.entrega));

  for (const t of ordenadas) {
    if (t.completada_en) grupos.hechas.unshift(t);
    else if (new Date(t.entrega) < ahora) grupos.vencidas.push(t);
    else {
      const n = diasEntre(hoy, diaEnZona(new Date(t.entrega), zona));
      if (n === 0) grupos.hoy.push(t);
      else if (n <= 7) grupos.semana.push(t);
      else grupos.despues.push(t);
    }
  }
  return grupos;
}

// Suma de porcentajes de una materia, para avisar si pasa de 100 %.
export function sumaPorcentajes(evaluaciones: { porcentaje: number }[]): number {
  return Math.round(evaluaciones.reduce((s, e) => s + Number(e.porcentaje), 0) * 100) / 100;
}
