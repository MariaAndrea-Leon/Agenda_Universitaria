import { describe, expect, it } from "vitest";
import { avisosPorEnviar, mensajeDe, type Pendiente } from "./recordatorios";

const ahora = new Date("2026-10-08T15:00:00Z");
const p = (id: string, cuando: string): Pendiente => ({
  tipo: "tarea",
  id,
  usuarioId: "u",
  titulo: `Tarea ${id}`,
  materia: "Cálculo",
  cuando,
});

describe("avisosPorEnviar", () => {
  it("avisa cuando el momento de envío cayó en la ventana", () => {
    // Entrega mañana a las 14:30 UTC: el aviso de 1 día era hoy a las 14:30.
    const r = avisosPorEnviar([p("a", "2026-10-09T14:30:00Z")], [1440, 60], ahora);
    expect(r).toHaveLength(1);
    expect(r[0].minutosAntes).toBe(1440);
    expect(r[0].enviarEn).toBe("2026-10-08T14:30:00.000Z");
  });

  it("no avisa antes de tiempo ni lo que ya pasó", () => {
    expect(avisosPorEnviar([p("a", "2026-10-09T15:30:00Z")], [1440], ahora)).toHaveLength(0);
    expect(avisosPorEnviar([p("a", "2026-10-08T14:59:00Z")], [1440, 60], ahora)).toHaveLength(0);
  });

  it("no revisa más atrás que la ventana", () => {
    // El aviso de 1 día fue hace 3 horas: fuera de la ventana de 2 horas.
    expect(avisosPorEnviar([p("a", "2026-10-09T12:00:00Z")], [1440], ahora)).toHaveLength(0);
  });

  it("si dos anticipaciones vencen juntas, manda solo la más cercana", () => {
    // Creada con poco margen: vencen 3 h y 1 h a la vez.
    const r = avisosPorEnviar([p("a", "2026-10-08T15:30:00Z")], [180, 60], ahora);
    expect(r).toHaveLength(1);
    expect(r[0].minutosAntes).toBe(60);
  });

  it("arma el mensaje", () => {
    const [a] = avisosPorEnviar([p("a", "2026-10-08T15:45:00Z")], [60], ahora);
    expect(mensajeDe(a)).toEqual({ titulo: "Entrega en 1 hora: Tarea a", cuerpo: "Cálculo", url: "/tareas" });
    expect(mensajeDe({ ...a, tipo: "evaluacion", minutosAntes: 1440 }).titulo).toBe("Evaluación mañana: Tarea a");
  });
});
