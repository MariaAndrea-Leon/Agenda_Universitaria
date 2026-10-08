// Genera los íconos de la app instalable a partir de un SVG.
// Uso: node scripts/iconos.mjs
import { mkdir, writeFile } from "node:fs/promises";
import sharp from "sharp";

const glifo = (escala) => `
  <g transform="translate(256 256) scale(${escala}) translate(-256 -256)" fill="none" stroke="#fff" stroke-linecap="round" stroke-linejoin="round">
    <rect x="120" y="138" width="272" height="250" rx="36" stroke-width="28"/>
    <path d="M120 214h272" stroke-width="28"/>
    <path d="M190 104v64M322 104v64" stroke-width="28"/>
    <path d="M196 300l42 42 82-86" stroke-width="32"/>
  </g>`;

const fondo = `
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#95122C"/>
      <stop offset="1" stop-color="#FF9408"/>
    </linearGradient>
  </defs>`;

// Ícono normal: esquinas redondeadas. Maskable: fondo completo y el dibujo
// dentro de la zona segura (80 % central) para que Android lo recorte bien.
const normal = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">${fondo}<rect width="512" height="512" rx="112" fill="url(#g)"/>${glifo(1)}</svg>`;
const enmascarable = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">${fondo}<rect width="512" height="512" fill="url(#g)"/>${glifo(0.78)}</svg>`;

await mkdir("public/iconos", { recursive: true });
await writeFile("src/app/icon.svg", normal);
const png = (svg, tam, ruta) => sharp(Buffer.from(svg)).resize(tam, tam).png().toFile(ruta);
await png(normal, 192, "public/iconos/icono-192.png");
await png(normal, 512, "public/iconos/icono-512.png");
await png(enmascarable, 512, "public/iconos/icono-maskable-512.png");
await png(enmascarable, 180, "src/app/apple-icon.png");
console.log("Íconos generados.");
