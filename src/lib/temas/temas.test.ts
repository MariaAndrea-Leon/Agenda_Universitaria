import { describe, expect, it } from "vitest";
import { TODOS_LOS_TEMAS, contraste } from "./temas";
import { cssDeTemas } from "./css";
import { COLORES_MATERIA } from "@/lib/modelos";

const TEXTO_NORMAL = 4.5;
const TEXTO_GRANDE = 3;

describe("contraste", () => {
  it("da 21 entre blanco y negro", () => {
    expect(contraste("#FFFFFF", "#000000")).toBeCloseTo(21, 1);
  });
});

describe.each(TODOS_LOS_TEMAS)("tema $nombre", (tema) => {
  const c = tema.colores;

  it("el texto se lee sobre el fondo y las tarjetas", () => {
    expect(contraste(c.texto, c.fondo)).toBeGreaterThanOrEqual(TEXTO_NORMAL);
    expect(contraste(c.texto, c.fondo2)).toBeGreaterThanOrEqual(TEXTO_NORMAL);
    expect(contraste(c.texto, c.superficie)).toBeGreaterThanOrEqual(TEXTO_NORMAL);
  });

  it("el texto de la barra se lee sobre la barra y al inicio del degradado", () => {
    expect(contraste(c.sobreBarra, c.barra)).toBeGreaterThanOrEqual(TEXTO_NORMAL);
    expect(contraste(c.sobreBarra, tema.degradado[0])).toBeGreaterThanOrEqual(TEXTO_NORMAL);
  });

  it("el texto se lee sobre el acento y el primario", () => {
    expect(contraste(c.sobreAcento, c.acento)).toBeGreaterThanOrEqual(TEXTO_NORMAL);
    expect(contraste(c.sobrePrimario, c.primario)).toBeGreaterThanOrEqual(TEXTO_NORMAL);
  });

  it("la alerta se lee al menos como texto grande", () => {
    expect(contraste(c.sobreAlerta, c.alerta)).toBeGreaterThanOrEqual(TEXTO_GRANDE);
  });
});

describe("colores de materia", () => {
  it.each(COLORES_MATERIA)("%s deja leer texto blanco", (color) => {
    expect(contraste("#FFFFFF", color)).toBeGreaterThanOrEqual(TEXTO_NORMAL);
  });
});

describe("cssDeTemas", () => {
  it("aplica el tema oscuro con data-modo y con la preferencia del dispositivo", () => {
    const css = cssDeTemas();
    expect(css).toContain(':root[data-modo="oscuro"] { --fondo: #051F20;');
    expect(css).toMatch(/@media \(prefers-color-scheme: dark\) \{ :root\[data-modo="sistema"\]/);
    // El modo oscuro va después de los temas claros para ganarles.
    expect(css.indexOf('data-modo="oscuro"')).toBeGreaterThan(css.indexOf('data-tema="tierra"'));
  });
});
