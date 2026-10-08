// Lógica pura del horario semanal: sin acceso a datos ni a React, para
// poder probarla aparte.

export const DIAS = [
  { numero: 1, nombre: "Lunes", corto: "Lun" },
  { numero: 2, nombre: "Martes", corto: "Mar" },
  { numero: 3, nombre: "Miércoles", corto: "Mié" },
  { numero: 4, nombre: "Jueves", corto: "Jue" },
  { numero: 5, nombre: "Viernes", corto: "Vie" },
  { numero: 6, nombre: "Sábado", corto: "Sáb" },
  { numero: 7, nombre: "Domingo", corto: "Dom" },
] as const;

export interface BloqueHorario {
  id: string;
  materia_id: string;
  dia_semana: number;
  hora_inicio: string; // "HH:MM" o "HH:MM:SS"
  hora_fin: string;
}

export function aMinutos(hora: string): number {
  const [h, m] = hora.split(":").map(Number);
  return h * 60 + m;
}

export function formatoHora(hora: string): string {
  return hora.slice(0, 5);
}

function seCruzan(a: BloqueHorario, b: BloqueHorario): boolean {
  return (
    a.dia_semana === b.dia_semana &&
    aMinutos(a.hora_inicio) < aMinutos(b.hora_fin) &&
    aMinutos(b.hora_inicio) < aMinutos(a.hora_fin)
  );
}

// Pares de bloques que se cruzan en el mismo día. Un bloque que termina
// justo cuando empieza otro no cuenta como choque.
export function choques<T extends BloqueHorario>(bloques: T[]): [T, T][] {
  const pares: [T, T][] = [];
  for (let i = 0; i < bloques.length; i++) {
    for (let j = i + 1; j < bloques.length; j++) {
      if (seCruzan(bloques[i], bloques[j])) pares.push([bloques[i], bloques[j]]);
    }
  }
  return pares;
}

// Bloques existentes que chocarían con uno nuevo.
export function choquesCon<T extends BloqueHorario>(
  nuevo: Omit<BloqueHorario, "id" | "materia_id">,
  existentes: T[],
): T[] {
  const candidato = { ...nuevo, id: "", materia_id: "" };
  return existentes.filter((b) => seCruzan(candidato, b));
}

// Rango de horas que debe mostrar la grilla: desde la hora en punto antes
// de la primera clase hasta la hora en punto después de la última, con un
// mínimo de 7:00 a 18:00 para que una semana vacía no se vea rara.
export function rangoGrilla(bloques: BloqueHorario[]): { desde: number; hasta: number } {
  let desde = 7 * 60;
  let hasta = 18 * 60;
  for (const b of bloques) {
    desde = Math.min(desde, Math.floor(aMinutos(b.hora_inicio) / 60) * 60);
    hasta = Math.max(hasta, Math.ceil(aMinutos(b.hora_fin) / 60) * 60);
  }
  return { desde, hasta };
}

// Días que se muestran: lunes a viernes siempre, sábado y domingo solo si
// tienen clases.
export function diasVisibles(bloques: BloqueHorario[]) {
  return DIAS.filter((d) => d.numero <= 5 || bloques.some((b) => b.dia_semana === d.numero));
}

// Para dibujar bloques que se cruzan lado a lado: a cada bloque le asigna un
// carril dentro de su día y dice cuántos carriles necesita ese día. Los
// bloques que no chocan con nada ocupan el ancho completo (carriles = 1).
export function carriles<T extends BloqueHorario>(bloques: T[]): Map<string, { carril: number; carriles: number }> {
  const resultado = new Map<string, { carril: number; carriles: number }>();
  const enChoque = new Set(choques(bloques).flat().map((b) => b.id));

  for (const dia of DIAS) {
    const delDia = bloques
      .filter((b) => b.dia_semana === dia.numero && enChoque.has(b.id))
      .sort((a, b) => aMinutos(a.hora_inicio) - aMinutos(b.hora_inicio));
    const finDeCarril: number[] = [];
    for (const b of delDia) {
      let carril = finDeCarril.findIndex((fin) => fin <= aMinutos(b.hora_inicio));
      if (carril === -1) carril = finDeCarril.length;
      finDeCarril[carril] = aMinutos(b.hora_fin);
      resultado.set(b.id, { carril, carriles: 0 });
    }
    for (const b of delDia) resultado.get(b.id)!.carriles = finDeCarril.length;
  }

  for (const b of bloques) if (!resultado.has(b.id)) resultado.set(b.id, { carril: 0, carriles: 1 });
  return resultado;
}
