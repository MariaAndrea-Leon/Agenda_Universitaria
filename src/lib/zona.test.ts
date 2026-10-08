import { describe, expect, it } from "vitest";
import {
  cuandoEs,
  diaEnZona,
  diaSemana,
  diasEntre,
  inicioDelDia,
  instanteALocal,
  localAInstante,
  sumarDias,
} from "./zona";

const BOG = "America/Bogota";

describe("zona horaria", () => {
  it("convierte la hora escrita en Bogotá al instante UTC correcto", () => {
    expect(localAInstante("2026-10-08T23:59", BOG).toISOString()).toBe("2026-10-09T04:59:00.000Z");
  });

  it("ida y vuelta entre instante y datetime-local", () => {
    expect(instanteALocal("2026-10-09T04:59:00.000Z", BOG)).toBe("2026-10-08T23:59");
  });

  it("el día en Bogotá no se corre aunque en UTC ya sea mañana", () => {
    expect(diaEnZona(new Date("2026-10-09T03:00:00Z"), BOG)).toBe("2026-10-08");
  });

  it("funciona con zonas con horario de verano", () => {
    // 2026-03-29 02:30 no existe en Madrid; 2026-07-01 12:00 es UTC+2.
    expect(localAInstante("2026-07-01T12:00", "Europe/Madrid").toISOString()).toBe("2026-07-01T10:00:00.000Z");
  });

  it("inicio del día", () => {
    expect(inicioDelDia("2026-10-08", BOG).toISOString()).toBe("2026-10-08T05:00:00.000Z");
  });

  it("aritmética de días y día de la semana", () => {
    expect(sumarDias("2026-10-31", 1)).toBe("2026-11-01");
    expect(diasEntre("2026-10-08", "2026-10-15")).toBe(7);
    expect(diaSemana("2026-10-08")).toBe(4); // jueves
    expect(diaSemana("2026-10-11")).toBe(7); // domingo
  });
});

describe("cuandoEs", () => {
  const ahora = new Date("2026-10-08T15:00:00Z"); // 10:00 en Bogotá

  it("marca vencida, hoy, mañana y días", () => {
    expect(cuandoEs("2026-10-08T14:00:00Z", ahora, BOG)).toBe("Vencida");
    expect(cuandoEs("2026-10-09T04:59:00Z", ahora, BOG)).toBe("Hoy"); // 23:59 de hoy
    expect(cuandoEs("2026-10-09T05:00:00Z", ahora, BOG)).toBe("Mañana");
    expect(cuandoEs("2026-10-12T15:00:00Z", ahora, BOG)).toBe("En 4 días");
  });
});
