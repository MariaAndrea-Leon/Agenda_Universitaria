// Fechas y horas en la zona horaria del estudiante (America/Bogota por
// defecto). El servidor corre en UTC, así que "hoy", "mañana" y lo que se
// escribe en un <input type="datetime-local"> se interpretan siempre en la
// zona del perfil, nunca en la del servidor.

export const ZONA_POR_DEFECTO = "America/Bogota";

export interface Partes {
  anio: number;
  mes: number; // 1-12
  dia: number;
  hora: number;
  minuto: number;
}

const formateadores = new Map<string, Intl.DateTimeFormat>();

function formateador(zona: string) {
  let f = formateadores.get(zona);
  if (!f) {
    f = new Intl.DateTimeFormat("en-US", {
      timeZone: zona,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
    formateadores.set(zona, f);
  }
  return f;
}

export function partesEnZona(instante: Date, zona: string): Partes {
  const p = Object.fromEntries(formateador(zona).formatToParts(instante).map((x) => [x.type, x.value]));
  return { anio: +p.year, mes: +p.month, dia: +p.day, hora: +p.hour, minuto: +p.minute };
}

const dos = (n: number) => String(n).padStart(2, "0");

// "YYYY-MM-DD" del instante en la zona dada.
export function diaEnZona(instante: Date, zona: string): string {
  const p = partesEnZona(instante, zona);
  return `${p.anio}-${dos(p.mes)}-${dos(p.dia)}`;
}

// ISO → "YYYY-MM-DDTHH:MM" para el valor de un datetime-local.
export function instanteALocal(iso: string, zona: string): string {
  const p = partesEnZona(new Date(iso), zona);
  return `${p.anio}-${dos(p.mes)}-${dos(p.dia)}T${dos(p.hora)}:${dos(p.minuto)}`;
}

// "YYYY-MM-DDTHH:MM" escrito en la zona dada → instante real.
export function localAInstante(local: string, zona: string): Date {
  const [fecha, hora = "00:00"] = local.split("T");
  const [a, m, d] = fecha.split("-").map(Number);
  const [h, min] = hora.split(":").map(Number);
  const comoUtc = Date.UTC(a, m - 1, d, h, min);
  // Se corrige dos veces por si el desfase cambia justo en esa fecha.
  let instante = comoUtc;
  for (let i = 0; i < 2; i++) {
    const p = partesEnZona(new Date(instante), zona);
    const visto = Date.UTC(p.anio, p.mes - 1, p.dia, p.hora, p.minuto);
    instante += comoUtc - visto;
  }
  return new Date(instante);
}

export function inicioDelDia(dia: string, zona: string): Date {
  return localAInstante(`${dia}T00:00`, zona);
}

export function sumarDias(dia: string, n: number): string {
  const [a, m, d] = dia.split("-").map(Number);
  const f = new Date(Date.UTC(a, m - 1, d + n));
  return f.toISOString().slice(0, 10);
}

// 1 = lunes ... 7 = domingo, como bloques_horario.dia_semana.
export function diaSemana(dia: string): number {
  const [a, m, d] = dia.split("-").map(Number);
  const js = new Date(Date.UTC(a, m - 1, d)).getUTCDay();
  return js === 0 ? 7 : js;
}

export function diasEntre(desde: string, hasta: string): number {
  const ms = (x: string) => {
    const [a, m, d] = x.split("-").map(Number);
    return Date.UTC(a, m - 1, d);
  };
  return Math.round((ms(hasta) - ms(desde)) / 86_400_000);
}

// "lun 13 oct · 11:59 p. m." en la zona del estudiante.
export function fechaHora(iso: string, zona: string): string {
  const f = new Date(iso);
  const dia = f.toLocaleDateString("es-CO", { timeZone: zona, weekday: "short", day: "numeric", month: "short" });
  const hora = f.toLocaleTimeString("es-CO", { timeZone: zona, hour: "numeric", minute: "2-digit" });
  return `${dia} · ${hora}`;
}

export function horaEnZona(iso: string, zona: string): string {
  return new Date(iso).toLocaleTimeString("es-CO", { timeZone: zona, hour: "numeric", minute: "2-digit" });
}

// "YYYY-MM-DD" → "miércoles 8 de octubre".
export function diaLargo(dia: string): string {
  const [a, m, d] = dia.split("-").map(Number);
  return new Date(Date.UTC(a, m - 1, d, 12)).toLocaleDateString("es-CO", {
    timeZone: "UTC",
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

// "Vencida", "Hoy", "Mañana", "En 3 días"...
export function cuandoEs(iso: string, ahora: Date, zona: string): string {
  if (new Date(iso) < ahora) return "Vencida";
  const n = diasEntre(diaEnZona(ahora, zona), diaEnZona(new Date(iso), zona));
  if (n === 0) return "Hoy";
  if (n === 1) return "Mañana";
  return `En ${n} días`;
}
