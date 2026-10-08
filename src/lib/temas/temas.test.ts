import { describe, expect, it } from "vitest";
import { TEMAS, contraste } from "./temas";

const TEXTO_NORMAL = 4.5;
const TEXTO_GRANDE = 3;

describe("contraste", () => {
  it("da 21 entre blanco y negro", () => {
    expect(contraste("#FFFFFF", "#000000")).toBeCloseTo(21, 1);
  });
});

describe.each(Object.values(TEMAS))("tema $nombre", (tema) => {
  const c = tema.colores;

  it("el texto se lee sobre el fondo y las tarjetas", () => {
    expect(contraste(c.texto, c.fondo)).toBeGreaterThanOrEqual(TEXTO_NORMAL);
    expect(contraste(c.texto, c.superficie)).toBeGreaterThanOrEqual(TEXTO_NORMAL);
  });

  it("el texto se lee sobre el acento y el primario", () => {
    expect(contraste(c.sobreAcento, c.acento)).toBeGreaterThanOrEqual(TEXTO_NORMAL);
    expect(contraste(c.sobrePrimario, c.primario)).toBeGreaterThanOrEqual(TEXTO_NORMAL);
  });

  it("la alerta se lee al menos como texto grande", () => {
    expect(contraste(c.sobreAlerta, c.alerta)).toBeGreaterThanOrEqual(TEXTO_GRANDE);
  });
});
