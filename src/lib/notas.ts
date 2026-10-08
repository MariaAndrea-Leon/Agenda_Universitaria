// Cálculos de notas en escala de 0,0 a 5,0.
//
// - "Acumulado": puntos ya asegurados sobre 5,0 = Σ nota × porcentaje.
// - "Llevo": promedio de lo calificado hasta ahora = acumulado ÷ % calificado.
// - "¿Cuánto necesito?": (meta − acumulado) ÷ % que falta por calificar.

export const NOTA_MAXIMA = 5;
const EPS = 1e-9;

export interface ConNota {
  porcentaje: number | string;
  nota: number | string | null;
}

export type Estado =
  | { tipo: "sin-notas" } // nada calificado todavía
  | { tipo: "asegurada" } // lo acumulado ya alcanza la meta
  | { tipo: "necesita"; nota: number } // promedio mínimo en lo que falta
  | { tipo: "inalcanzable"; nota: number } // necesitaría más de 5,0
  | { tipo: "terminada"; aprobada: boolean }; // ya no queda nada por calificar

export interface Resumen {
  calificado: number; // % con nota
  restante: number; // % sin nota (incluye lo que aún no está en el plan)
  planeado: number; // % del plan de evaluación
  acumulado: number;
  llevo: number | null;
  necesito: number | null;
  estado: Estado;
}

const redondear = (n: number, dec = 2) => Math.round(n * 10 ** dec) / 10 ** dec;

// Se redondea hacia arriba: si se necesita 3,41 hay que sacar 3,5.
export const haciaArriba = (n: number) => Math.ceil(n * 10 - EPS) / 10 + 0; // + 0 evita -0

export function resumenMateria(evaluaciones: ConNota[], meta: number): Resumen {
  let planeado = 0;
  let calificado = 0;
  let puntos = 0;
  for (const e of evaluaciones) {
    const p = Number(e.porcentaje);
    planeado += p;
    if (e.nota != null) {
      calificado += p;
      puntos += Number(e.nota) * p;
    }
  }
  calificado = redondear(calificado);
  planeado = redondear(planeado);
  const restante = redondear(Math.max(0, 100 - calificado));
  const acumulado = puntos / 100;
  const llevo = calificado > 0 ? redondear(puntos / calificado) : null;
  const necesito = restante > 0 ? Math.max(0, (meta - acumulado) / (restante / 100)) : null;

  let estado: Estado;
  if (acumulado + EPS >= meta) estado = calificado > 0 ? { tipo: "asegurada" } : { tipo: "sin-notas" };
  else if (restante === 0) estado = { tipo: "terminada", aprobada: false };
  else if (calificado === 0) estado = { tipo: "sin-notas" };
  else if (necesito! > NOTA_MAXIMA + EPS) estado = { tipo: "inalcanzable", nota: haciaArriba(necesito!) };
  else estado = { tipo: "necesita", nota: haciaArriba(necesito!) };
  if (restante === 0 && acumulado + EPS >= meta) estado = { tipo: "terminada", aprobada: true };

  return {
    calificado,
    restante,
    planeado,
    acumulado: redondear(acumulado),
    llevo,
    necesito: necesito == null ? null : haciaArriba(necesito),
    estado,
  };
}

// Promedio del semestre ponderado por créditos con lo que se lleva en cada
// materia. Las materias sin notas no cuentan; si ninguna tiene créditos, se
// promedia simple.
export function promedioSemestre(materias: { creditos: number | null; llevo: number | null }[]): number | null {
  const conNota = materias.filter((m) => m.llevo != null);
  if (conNota.length === 0) return null;
  const usarCreditos = conNota.some((m) => (m.creditos ?? 0) > 0);
  let suma = 0;
  let peso = 0;
  for (const m of conNota) {
    const w = usarCreditos ? (m.creditos ?? 0) : 1;
    suma += m.llevo! * w;
    peso += w;
  }
  return peso > 0 ? redondear(suma / peso) : null;
}

// "3,5" o "3.5" → 3.5; "" → null; cualquier otra cosa → undefined (inválida).
export function leerNota(texto: string | null | undefined): number | null | undefined {
  const t = (texto ?? "").trim().replace(",", ".");
  if (t === "") return null;
  if (!/^\d(\.\d)?$/.test(t)) return undefined;
  const n = Number(t);
  return n >= 0 && n <= NOTA_MAXIMA ? n : undefined;
}

export function formatoNota(n: number, decimales = 1): string {
  return n.toLocaleString("es-CO", { minimumFractionDigits: decimales, maximumFractionDigits: decimales });
}
