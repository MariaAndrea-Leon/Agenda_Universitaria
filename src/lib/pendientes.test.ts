import { describe, expect, it } from "vitest";
import { agruparTareas, sumaPorcentajes } from "./pendientes";

const ahora = new Date("2026-10-08T15:00:00Z"); // jueves 10:00 en Bogotá
const t = (id: string, entrega: string, hecha = false) => ({
  id,
  entrega,
  completada_en: hecha ? "2026-10-07T00:00:00Z" : null,
});

describe("agruparTareas", () => {
  it("reparte por vencidas, hoy, semana, después y hechas", () => {
    const g = agruparTareas(
      [
        t("vencida", "2026-10-07T20:00:00Z"),
        t("hoy-noche", "2026-10-09T04:59:00Z"),
        t("manana", "2026-10-09T15:00:00Z"),
        t("en-7", "2026-10-15T20:00:00Z"),
        t("en-10", "2026-10-18T20:00:00Z"),
        t("hecha", "2026-10-01T20:00:00Z", true),
      ],
      ahora,
      "America/Bogota",
    );
    expect(g.vencidas.map((x) => x.id)).toEqual(["vencida"]);
    expect(g.hoy.map((x) => x.id)).toEqual(["hoy-noche"]);
    expect(g.semana.map((x) => x.id)).toEqual(["manana", "en-7"]);
    expect(g.despues.map((x) => x.id)).toEqual(["en-10"]);
    expect(g.hechas.map((x) => x.id)).toEqual(["hecha"]);
  });

  it("una hecha no cuenta como vencida", () => {
    expect(agruparTareas([t("x", "2026-10-01T00:00:00Z", true)], ahora, "America/Bogota").vencidas).toEqual([]);
  });
});

describe("sumaPorcentajes", () => {
  it("suma sin errores de coma flotante", () => {
    expect(sumaPorcentajes([{ porcentaje: 33.3 }, { porcentaje: 33.3 }, { porcentaje: 33.4 }])).toBe(100);
  });
});
