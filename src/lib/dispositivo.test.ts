import { describe, expect, it } from "vitest";
import { comoAbrir, nombreDispositivo } from "./dispositivo";

const UA = {
  chromeAndroid: "Mozilla/5.0 (Linux; Android 14; SM-A546E) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Mobile Safari/537.36",
  tabletAndroid: "Mozilla/5.0 (Linux; Android 13; SM-X200) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Safari/537.36",
  iphone: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1",
  ipad: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15",
  edge: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Safari/537.36 Edg/129.0",
  firefoxMac: "Mozilla/5.0 (Macintosh; Intel Mac OS X 14.6; rv:131.0) Gecko/20100101 Firefox/131.0",
};

describe("nombreDispositivo", () => {
  it("reconoce navegador y equipo", () => {
    expect(nombreDispositivo(UA.chromeAndroid)).toBe("Chrome en celular Android");
    expect(nombreDispositivo(UA.tabletAndroid)).toBe("Chrome en tablet Android");
    expect(nombreDispositivo(UA.iphone)).toBe("Safari en iPhone");
    expect(nombreDispositivo(UA.ipad, 5)).toBe("Safari en iPad");
    expect(nombreDispositivo(UA.ipad, 0)).toBe("Safari en Mac");
    expect(nombreDispositivo(UA.edge)).toBe("Edge en Windows");
    expect(nombreDispositivo(UA.firefoxMac)).toBe("Firefox en Mac");
    expect(nombreDispositivo("")).toBe("Navegador en otro equipo");
  });

  it("explica cómo abrir la app instalada", () => {
    expect(comoAbrir(UA.iphone)).toMatch(/pantalla de inicio/);
    expect(comoAbrir(UA.edge)).toMatch(/Abrir en la app/);
    expect(comoAbrir(UA.firefoxMac)).not.toMatch(/Abrir en la app/);
  });
});
