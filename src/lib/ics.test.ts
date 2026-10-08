import { describe, expect, it } from "vitest";
import { escapar, fechaUtc, generarIcs, plegar } from "./ics";

describe("ics", () => {
  it("escapa comas, puntos y coma y saltos de línea", () => {
    expect(escapar("Taller 1, parte A; ver\nnotas")).toBe("Taller 1\\, parte A\; ver\\nnotas");
  });

  it("pliega líneas largas sin pasar de 75 bytes, respetando tildes", () => {
    const linea = `SUMMARY:${"Cálculo ".repeat(20)}`;
    const partes = plegar(linea).split("\r\n");
    expect(partes.length).toBeGreaterThan(1);
    for (const p of partes) expect(new TextEncoder().encode(p).length).toBeLessThanOrEqual(75);
    expect(partes.map((p, i) => (i ? p.slice(1) : p)).join("")).toBe(linea);
  });

  it("convierte a UTC", () => {
    expect(fechaUtc("2026-10-08T23:59:00-05:00")).toBe("20261009T045900Z");
  });

  it("arma eventos puntuales y semanales", () => {
    const ics = generarIcs(
      "Agenda",
      "America/Bogota",
      [
        { uid: "t1@agenda", titulo: "Entrega: Taller", inicio: "2026-10-09T04:29:00Z", fin: "2026-10-09T04:59:00Z" },
        {
          uid: "b1@agenda",
          titulo: "Cálculo",
          lugar: "203",
          semanal: { primerDia: "2026-08-03", horaInicio: "07:00:00", horaFin: "09:00:00", hasta: "2026-12-04" },
        },
      ],
      new Date("2026-10-08T12:00:00Z"),
    );
    expect(ics.startsWith("BEGIN:VCALENDAR\r\n")).toBe(true);
    expect(ics.endsWith("END:VCALENDAR\r\n")).toBe(true);
    expect(ics).toContain("DTSTART:20261009T042900Z");
    expect(ics).toContain("DTSTART;TZID=America/Bogota:20260803T070000");
    expect(ics).toContain("RRULE:FREQ=WEEKLY;UNTIL=20261204T235959Z");
    expect(ics).toContain("LOCATION:203");
    expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(2);
  });
});
