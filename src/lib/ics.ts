// Archivo iCalendar (.ics) con las entregas, exámenes y clases, para
// suscribirse desde Google Calendar, Apple o Outlook.

export interface EventoIcs {
  uid: string;
  titulo: string;
  descripcion?: string;
  lugar?: string;
  // Evento puntual: instantes reales (ISO).
  inicio?: string;
  fin?: string;
  // Evento semanal: hora local en la zona del estudiante.
  semanal?: { primerDia: string; horaInicio: string; horaFin: string; hasta: string };
}

const CRLF = "\r\n";

export function escapar(texto: string): string {
  return texto.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\;");
}

// Las líneas no pueden pasar de 75 bytes; se continúan con un espacio.
export function plegar(linea: string): string {
  const bytes = new TextEncoder();
  const partes: string[] = [];
  let actual = "";
  for (const c of linea) {
    const limite = partes.length === 0 ? 75 : 74;
    if (bytes.encode(actual + c).length > limite) {
      partes.push(actual);
      actual = c;
    } else actual += c;
  }
  partes.push(actual);
  return partes.join(`${CRLF} `);
}

// 2026-10-08T15:00:00.000Z → 20261008T150000Z
export function fechaUtc(iso: string): string {
  return new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

// "2026-10-08" + "07:00:00" → 20261008T070000
function fechaLocal(dia: string, hora: string): string {
  return `${dia.replace(/-/g, "")}T${hora.slice(0, 5).replace(":", "")}00`;
}

export function generarIcs(nombre: string, zona: string, eventos: EventoIcs[], ahora = new Date()): string {
  const lineas = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Agenda Universitaria//ES",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapar(nombre)}`,
    `X-WR-TIMEZONE:${zona}`,
    "REFRESH-INTERVAL;VALUE=DURATION:PT1H",
    "X-PUBLISHED-TTL:PT1H",
  ];
  const sello = fechaUtc(ahora.toISOString());
  for (const e of eventos) {
    lineas.push("BEGIN:VEVENT", `UID:${e.uid}`, `DTSTAMP:${sello}`, `SUMMARY:${escapar(e.titulo)}`);
    if (e.semanal) {
      const s = e.semanal;
      lineas.push(
        `DTSTART;TZID=${zona}:${fechaLocal(s.primerDia, s.horaInicio)}`,
        `DTEND;TZID=${zona}:${fechaLocal(s.primerDia, s.horaFin)}`,
        `RRULE:FREQ=WEEKLY;UNTIL=${s.hasta.replace(/-/g, "")}T235959Z`,
      );
    } else if (e.inicio && e.fin) {
      lineas.push(`DTSTART:${fechaUtc(e.inicio)}`, `DTEND:${fechaUtc(e.fin)}`);
    }
    if (e.lugar) lineas.push(`LOCATION:${escapar(e.lugar)}`);
    if (e.descripcion) lineas.push(`DESCRIPTION:${escapar(e.descripcion)}`);
    lineas.push("END:VEVENT");
  }
  lineas.push("END:VCALENDAR");
  return lineas.map(plegar).join(CRLF) + CRLF;
}
