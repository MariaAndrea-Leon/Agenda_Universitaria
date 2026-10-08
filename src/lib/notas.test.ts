import { describe, expect, it } from "vitest";
import { formatoNota, haciaArriba, leerNota, promedioSemestre, resumenMateria } from "./notas";

const plan = (...filas: [number, number | null][]) => filas.map(([porcentaje, nota]) => ({ porcentaje, nota }));

describe("resumenMateria", () => {
  it("calcula lo que llevo, el acumulado y cuánto necesito", () => {
    // 30 % con 2,5 y 30 % con 3,5: llevo 3,0, acumulado 1,8, faltan 40 %.
    const r = resumenMateria(plan([30, 2.5], [30, 3.5], [40, null]), 3);
    expect(r.calificado).toBe(60);
    expect(r.restante).toBe(40);
    expect(r.llevo).toBe(3);
    expect(r.acumulado).toBe(1.8);
    expect(r.necesito).toBe(3); // (3 − 1,8) ÷ 0,4
    expect(r.estado).toEqual({ tipo: "necesita", nota: 3 });
  });

  it("redondea hacia arriba lo que se necesita", () => {
    // acumulado 0,6; (3 − 0,6) ÷ 0,7 = 3,428… → 3,5
    const r = resumenMateria(plan([30, 2], [70, null]), 3);
    expect(r.estado).toEqual({ tipo: "necesita", nota: 3.5 });
  });

  it("avisa cuando ya no es alcanzable", () => {
    const r = resumenMateria(plan([35, 0.5], [35, 1], [30, null]), 3);
    expect(r.estado.tipo).toBe("inalcanzable");
    if (r.estado.tipo === "inalcanzable") expect(r.estado.nota).toBeGreaterThan(5);
  });

  it("dice que ya está asegurada cuando lo acumulado alcanza la meta", () => {
    const r = resumenMateria(plan([35, 5], [35, 4], [30, null]), 3);
    expect(r.acumulado).toBe(3.15);
    expect(r.estado).toEqual({ tipo: "asegurada" });
    expect(r.necesito).toBe(0);
  });

  it("cierra la materia cuando todo está calificado", () => {
    expect(resumenMateria(plan([50, 3], [50, 3]), 3).estado).toEqual({ tipo: "terminada", aprobada: true });
    expect(resumenMateria(plan([50, 2.9], [50, 3]), 3).estado).toEqual({ tipo: "terminada", aprobada: false });
  });

  it("sin notas no calcula promedio", () => {
    const r = resumenMateria(plan([30, null], [70, null]), 3);
    expect(r.llevo).toBeNull();
    expect(r.estado).toEqual({ tipo: "sin-notas" });
    expect(r.necesito).toBe(3);
    expect(resumenMateria([], 3).planeado).toBe(0);
  });

  it("cuenta lo que no está en el plan como pendiente", () => {
    const r = resumenMateria(plan([30, 4], [30, null]), 3);
    expect(r.planeado).toBe(60);
    expect(r.restante).toBe(70);
  });

  it("acepta los porcentajes como texto, como los devuelve Postgres", () => {
    const r = resumenMateria([{ porcentaje: "20.5", nota: "4.0" }, { porcentaje: "79.5", nota: null }], 3);
    expect(r.calificado).toBe(20.5);
    expect(r.llevo).toBe(4);
  });
});

describe("promedioSemestre", () => {
  it("pondera por créditos y omite materias sin notas", () => {
    expect(
      promedioSemestre([
        { creditos: 4, llevo: 4 },
        { creditos: 2, llevo: 2.5 },
        { creditos: 3, llevo: null },
      ]),
    ).toBe(3.5);
  });
  it("promedia simple si no hay créditos", () => {
    expect(promedioSemestre([{ creditos: null, llevo: 3 }, { creditos: null, llevo: 4 }])).toBe(3.5);
    expect(promedioSemestre([])).toBeNull();
  });
});

describe("leerNota y formatoNota", () => {
  it("lee notas con coma o punto", () => {
    expect(leerNota("3,5")).toBe(3.5);
    expect(leerNota("4.0")).toBe(4);
    expect(leerNota("5")).toBe(5);
    expect(leerNota("")).toBeNull();
    expect(leerNota("5,1")).toBeUndefined();
    expect(leerNota("3,45")).toBeUndefined();
    expect(leerNota("abc")).toBeUndefined();
  });
  it("muestra con coma decimal", () => {
    expect(formatoNota(3)).toBe("3,0");
    expect(formatoNota(3.456, 2)).toBe("3,46");
    expect(haciaArriba(3.0000000001)).toBe(3);
  });
});
