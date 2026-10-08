import { describe, expect, it } from "vitest";
import { mesValido, mesVecino, semanasDelMes } from "./calendario";

describe("calendario", () => {
  it("valida el mes de la URL", () => {
    expect(mesValido("2026-10")).toBe("2026-10");
    expect(mesValido("2026-13")).toBeNull();
    expect(mesValido("x")).toBeNull();
    expect(mesValido(undefined)).toBeNull();
  });

  it("pasa de un año a otro", () => {
    expect(mesVecino("2026-12", 1)).toBe("2027-01");
    expect(mesVecino("2026-01", -1)).toBe("2025-12");
  });

  it("arma semanas de lunes a domingo que cubren el mes", () => {
    const s = semanasDelMes("2026-10"); // 1 de octubre de 2026 es jueves
    expect(s[0][0]).toBe("2026-09-28");
    expect(s[0][3]).toBe("2026-10-01");
    expect(s.at(-1)!.at(-1)).toBe("2026-11-01");
    expect(s).toHaveLength(5);
    expect(s.every((w) => w.length === 7)).toBe(true);
  });

  it("no agrega una semana de sobra cuando el mes empieza en lunes", () => {
    const s = semanasDelMes("2026-06"); // 1 de junio de 2026 es lunes
    expect(s[0][0]).toBe("2026-06-01");
    expect(s.at(-1)!.at(-1)).toBe("2026-07-05");
  });
});
