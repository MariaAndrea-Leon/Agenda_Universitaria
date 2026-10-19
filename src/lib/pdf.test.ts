import { describe, expect, it } from "vitest";
import { armarPdf } from "./pdf";

// JPEG de 2 x 3 píxeles.
const JPEG = Uint8Array.from(atob("/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAADAAIDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwDkaKKK8o/Sz//Z"), (c) => c.charCodeAt(0));
const leer = (b: Uint8Array) => new TextDecoder("latin1").decode(b);

describe("armarPdf", () => {
  const pdf = armarPdf(
    [
      { jpeg: JPEG, pixelesAncho: 2, pixelesAlto: 3, ancho: 595.28, alto: 841.89 },
      { jpeg: JPEG, pixelesAncho: 2, pixelesAlto: 3, ancho: 595.28, alto: 300 },
    ],
    "Cálculo · señales",
  );
  const s = leer(pdf);

  it("tiene cabecera, dos páginas y final", () => {
    expect(s.startsWith("%PDF-1.4")).toBe(true);
    expect(s).toContain("/Count 2");
    expect(s).toContain("/MediaBox [0 0 595.28 300]");
    expect(s.trimEnd().endsWith("%%EOF")).toBe(true);
  });

  it("cada entrada del índice apunta a su objeto", () => {
    const inicio = Number(s.match(/startxref\n(\d+)/)![1]);
    expect(s.slice(inicio, inicio + 4)).toBe("xref");
    const filas = s.slice(inicio).split("\n").slice(3).filter((l) => / n $/.test(l));
    expect(filas).toHaveLength(9);
    filas.forEach((fila, i) => expect(s.slice(Number(fila.slice(0, 10))).startsWith(`${i + 1} 0 obj`)).toBe(true));
  });

  it("el título va en UTF-16 con tildes", () => {
    expect(s).toContain("/Title <FEFF004300e1");
    expect(s).toContain("00f1"); // ñ
  });

  it("la imagen va completa dentro del PDF", () => {
    expect(s).toContain(`/Filter /DCTDecode /Length ${JPEG.length}`);
    expect(s).toContain(leer(JPEG));
  });
});
