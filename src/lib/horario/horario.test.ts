import { describe, expect, it } from "vitest";
import { carriles, choques, choquesCon, diasVisibles, rangoGrilla, type BloqueHorario } from "./horario";

function bloque(id: string, dia: number, inicio: string, fin: string): BloqueHorario {
  return { id, materia_id: `m-${id}`, dia_semana: dia, hora_inicio: inicio, hora_fin: fin };
}

describe("choques", () => {
  it("detecta dos clases que se cruzan el mismo día", () => {
    const a = bloque("a", 1, "08:00", "10:00");
    const b = bloque("b", 1, "09:00", "11:00");
    expect(choques([a, b])).toEqual([[a, b]]);
  });

  it("no cuenta clases seguidas como choque", () => {
    expect(choques([bloque("a", 1, "08:00", "10:00"), bloque("b", 1, "10:00:00", "12:00:00")])).toEqual([]);
  });

  it("no cuenta la misma hora en días distintos", () => {
    expect(choques([bloque("a", 1, "08:00", "10:00"), bloque("b", 2, "08:00", "10:00")])).toEqual([]);
  });

  it("detecta una clase contenida dentro de otra", () => {
    expect(choques([bloque("a", 3, "07:00", "12:00"), bloque("b", 3, "09:00", "10:00")])).toHaveLength(1);
  });
});

describe("choquesCon", () => {
  it("devuelve los bloques existentes que chocan con uno nuevo", () => {
    const existentes = [bloque("a", 2, "14:00", "16:00"), bloque("b", 2, "16:00", "18:00")];
    expect(choquesCon({ dia_semana: 2, hora_inicio: "15:00", hora_fin: "16:30" }, existentes)).toEqual(existentes);
    expect(choquesCon({ dia_semana: 2, hora_inicio: "12:00", hora_fin: "14:00" }, existentes)).toEqual([]);
  });
});

describe("rangoGrilla", () => {
  it("usa 7:00 a 18:00 si no hay clases", () => {
    expect(rangoGrilla([])).toEqual({ desde: 420, hasta: 1080 });
  });

  it("se amplía a horas en punto para clases tempranas o tardías", () => {
    expect(rangoGrilla([bloque("a", 1, "06:30", "08:00"), bloque("b", 2, "19:15", "20:45")])).toEqual({
      desde: 360,
      hasta: 1260,
    });
  });
});

describe("diasVisibles", () => {
  it("muestra el sábado solo si tiene clases", () => {
    expect(diasVisibles([]).map((d) => d.numero)).toEqual([1, 2, 3, 4, 5]);
    expect(diasVisibles([bloque("a", 6, "08:00", "12:00")]).map((d) => d.numero)).toEqual([1, 2, 3, 4, 5, 6]);
  });
});

describe("carriles", () => {
  it("pone lado a lado los bloques que se cruzan y deja el resto a ancho completo", () => {
    const a = bloque("a", 1, "08:00", "10:00");
    const b = bloque("b", 1, "09:00", "11:00");
    const c = bloque("c", 1, "14:00", "16:00");
    const r = carriles([a, b, c]);
    expect(r.get("a")).toEqual({ carril: 0, carriles: 2 });
    expect(r.get("b")).toEqual({ carril: 1, carriles: 2 });
    expect(r.get("c")).toEqual({ carril: 0, carriles: 1 });
  });
});
