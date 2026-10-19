// Arma un PDF con una imagen JPEG por página, sin librerías. Cada página
// mide `ancho` x `alto` puntos (1 punto = 1/72 de pulgada) y la imagen la
// llena entera.
export interface PaginaPdf {
  jpeg: Uint8Array;
  pixelesAncho: number;
  pixelesAlto: number;
  ancho: number;
  alto: number;
}

const texto = (s: string) => new TextEncoder().encode(s);
const num = (n: number) => (Math.round(n * 100) / 100).toString();

export function armarPdf(paginas: PaginaPdf[], titulo = ""): Uint8Array {
  const partes: Uint8Array[] = [];
  const posiciones: number[] = [];
  let largo = 0;
  const poner = (p: Uint8Array | string) => {
    const b = typeof p === "string" ? texto(p) : p;
    partes.push(b);
    largo += b.length;
  };
  const objeto = (id: number, ...contenido: (Uint8Array | string)[]) => {
    posiciones[id] = largo;
    poner(`${id} 0 obj\n`);
    for (const c of contenido) poner(c);
    poner("\nendobj\n");
  };

  // 1 catálogo, 2 páginas, 3 información; luego 3 objetos por página.
  const idPagina = (i: number) => 4 + i * 3;
  poner("%PDF-1.4\n%\xE2\xE3\xCF\xD3\n");
  objeto(1, "<< /Type /Catalog /Pages 2 0 R >>");
  objeto(2, `<< /Type /Pages /Kids [${paginas.map((_, i) => `${idPagina(i)} 0 R`).join(" ")}] /Count ${paginas.length} >>`);
  // Título en UTF-16 para que salgan tildes y eñes.
  const hex = [...titulo].map((c) => c.charCodeAt(0).toString(16).padStart(4, "0")).join("");
  objeto(3, `<< /Title <FEFF${hex}> /Producer (Agenda Universitaria) >>`);
  paginas.forEach((p, i) => {
    const id = idPagina(i);
    const dibujar = `q ${num(p.ancho)} 0 0 ${num(p.alto)} 0 0 cm /Im0 Do Q`;
    objeto(
      id,
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${num(p.ancho)} ${num(p.alto)}] ` +
        `/Resources << /XObject << /Im0 ${id + 2} 0 R >> >> /Contents ${id + 1} 0 R >>`,
    );
    objeto(id + 1, `<< /Length ${dibujar.length} >>\nstream\n${dibujar}\nendstream`);
    objeto(
      id + 2,
      `<< /Type /XObject /Subtype /Image /Width ${p.pixelesAncho} /Height ${p.pixelesAlto} ` +
        `/ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${p.jpeg.length} >>\nstream\n`,
      p.jpeg,
      "\nendstream",
    );
  });

  const total = idPagina(paginas.length);
  const inicioXref = largo;
  poner(`xref\n0 ${total}\n0000000000 65535 f \n`);
  for (let id = 1; id < total; id++) poner(`${String(posiciones[id]).padStart(10, "0")} 00000 n \n`);
  poner(`trailer\n<< /Size ${total} /Root 1 0 R /Info 3 0 R >>\nstartxref\n${inicioXref}\n%%EOF\n`);

  const salida = new Uint8Array(largo);
  let i = 0;
  for (const p of partes) {
    salida.set(p, i);
    i += p.length;
  }
  return salida;
}
