import { describe, expect, it } from "vitest";
import {
  agregarPunto,
  ALTO_INICIAL,
  altoUsado,
  caminoSvg,
  colorInicial,
  COLORES,
  cajaTexto,
  dentroDe,
  dibujoVacio,
  fondoDe,
  leerDibujo,
  tocaTrazo,
  type Trazo,
} from "./pizarron";

describe("pizarrón", () => {
  it("tiene al menos 10 colores distintos", () => {
    expect(new Set(COLORES.map((c) => c.valor)).size).toBeGreaterThanOrEqual(10);
  });

  it("empieza con tiza blanca en la pizarra y tinta negra en la hoja", () => {
    expect(colorInicial(fondoDe("pizarra-cuadros"))).toBe("#F5F5F0");
    expect(colorInicial(fondoDe("hoja-cuadros"))).toBe("#1A1A1A");
    expect(fondoDe("desconocido").id).toBe("pizarra-cuadros");
  });

  it("descarta dibujos dañados y acepta los válidos", () => {
    expect(leerDibujo(null)).toEqual(dibujoVacio());
    expect(leerDibujo({ v: 1, alto: 5, trazos: [], textos: [] }).alto).toBe(ALTO_INICIAL);
    const bueno = {
      v: 1,
      alto: 2100,
      trazos: [{ h: "lapiz", c: "#FFD23F", g: 6, p: [1, 2, 0.5] }],
      textos: [{ id: "a", x: 10, y: 20, c: "#F5F5F0", s: 36, t: "ATP" }],
    };
    expect(leerDibujo(bueno)).toEqual(bueno);
    expect(leerDibujo({ ...bueno, trazos: [{ ...bueno.trazos[0], p: [1, 2] }] })).toEqual(dibujoVacio());
  });

  it("ignora puntos demasiado cercanos y redondea", () => {
    const p: number[] = [];
    expect(agregarPunto(p, 10.123, 20.456, 0.5)).toBe(true);
    expect(agregarPunto(p, 10.5, 20.5, 0.5)).toBe(false);
    expect(agregarPunto(p, 15, 20, 1.4)).toBe(true);
    expect(p).toEqual([10.1, 20.5, 0.5, 15, 20, 1]);
  });

  it("arma caminos suaves", () => {
    expect(caminoSvg([5, 5, 0.5])).toBe("M5 5l0.01 0");
    expect(caminoSvg([0, 0, 0.5, 10, 0, 0.5, 20, 10, 0.5])).toBe("M0 0Q10 0 15 5L20 10");
  });

  it("detecta si el borrador toca un trazo", () => {
    const t: Trazo = { h: "lapiz", c: "#000000", g: 4, p: [0, 0, 0.5, 100, 0, 0.5] };
    expect(tocaTrazo(t, 50, 8, 6)).toBe(true);
    expect(tocaTrazo(t, 50, 20, 6)).toBe(false);
    expect(tocaTrazo({ ...t, p: [0, 0, 0.5] }, 3, 3, 4)).toBe(true);
  });

  it("calcula la caja de un texto de varias líneas", () => {
    const caja = cajaTexto({ id: "a", x: 10, y: 10, c: "#000000", s: 20, t: "hola\nmundo!" });
    expect(caja.alto).toBe(50);
    expect(caja.ancho).toBeCloseTo(66);
    expect(dentroDe(caja, 40, 40)).toBe(true);
    expect(dentroDe(caja, 200, 40)).toBe(false);
  });

  it("mide el alto usado", () => {
    expect(altoUsado(dibujoVacio())).toBe(0);
    expect(
      altoUsado({ v: 1, alto: 1400, trazos: [{ h: "lapiz", c: "#000000", g: 4, p: [0, 300, 0.5] }], textos: [] }),
    ).toBe(304);
  });
});
