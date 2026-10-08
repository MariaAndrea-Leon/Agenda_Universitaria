import { diaSemana, sumarDias } from "@/lib/zona";

// "YYYY-MM" válido o null.
export function mesValido(mes: string | undefined): string | null {
  if (!mes || !/^\d{4}-(0[1-9]|1[0-2])$/.test(mes)) return null;
  return mes;
}

export function mesVecino(mes: string, n: number): string {
  const [a, m] = mes.split("-").map(Number);
  const f = new Date(Date.UTC(a, m - 1 + n, 1));
  return f.toISOString().slice(0, 7);
}

// Semanas (de lunes a domingo) que cubren el mes, con los días de los meses
// vecinos para completar la primera y la última fila.
export function semanasDelMes(mes: string): string[][] {
  const primero = `${mes}-01`;
  let dia = sumarDias(primero, 1 - diaSemana(primero));
  const siguiente = `${mesVecino(mes, 1)}-01`;
  const semanas: string[][] = [];
  while (dia < siguiente) {
    const semana: string[] = [];
    for (let i = 0; i < 7; i++) {
      semana.push(dia);
      dia = sumarDias(dia, 1);
    }
    semanas.push(semana);
  }
  return semanas;
}

// "octubre de 2026"
export function nombreDelMes(mes: string): string {
  const [a, m] = mes.split("-").map(Number);
  return new Date(Date.UTC(a, m - 1, 15)).toLocaleDateString("es-CO", {
    timeZone: "UTC",
    month: "long",
    year: "numeric",
  });
}
