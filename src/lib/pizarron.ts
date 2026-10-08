// Pizarrón de apuntes: modelo del dibujo, fondos, colores y geometría.
// Todo se guarda en coordenadas de una hoja de ANCHO unidades de ancho, así
// el mismo apunte se ve igual en el celular, la tablet y el computador.

import { z } from "zod";

export const ANCHO = 1000;
export const ALTO_INICIAL = 1400;
export const ALTO_EXTRA = 700;
export const ALTO_MAXIMO = 14000;
export const CUADRO = 25;

export type Herramienta = "lapiz" | "resaltador";

// p: puntos seguidos como x, y, presión (0 a 1).
export interface Trazo {
  h: Herramienta;
  c: string;
  g: number;
  p: number[];
}

export interface Texto {
  id: string;
  x: number;
  y: number;
  c: string;
  s: number;
  t: string;
}

export interface Dibujo {
  v: 1;
  alto: number;
  trazos: Trazo[];
  textos: Texto[];
}

export const dibujoVacio = (): Dibujo => ({ v: 1, alto: ALTO_INICIAL, trazos: [], textos: [] });

export const FONDOS = [
  { id: "pizarra-cuadros", nombre: "Pizarra con cuadros", base: "#1E2124", linea: "rgba(255,255,255,0.09)", tipo: "cuadros", oscuro: true },
  { id: "pizarra", nombre: "Pizarra lisa", base: "#1E2124", linea: "", tipo: "liso", oscuro: true },
  { id: "pizarra-verde", nombre: "Pizarra verde", base: "#24402F", linea: "", tipo: "liso", oscuro: true },
  { id: "hoja-cuadros", nombre: "Hoja cuadriculada", base: "#FBFCFE", linea: "rgba(47,111,228,0.16)", tipo: "cuadros", oscuro: false },
  { id: "hoja-rayas", nombre: "Hoja de renglones", base: "#FBFCFE", linea: "rgba(47,111,228,0.22)", tipo: "rayas", oscuro: false },
  { id: "hoja", nombre: "Hoja blanca", base: "#FFFFFF", linea: "", tipo: "liso", oscuro: false },
] as const;

export type FondoId = (typeof FONDOS)[number]["id"];
export type Fondo = (typeof FONDOS)[number];
export const FONDO_POR_DEFECTO: FondoId = "pizarra-cuadros";

export function fondoDe(id: string | null | undefined): Fondo {
  return FONDOS.find((f) => f.id === id) ?? FONDOS[0];
}

export const COLORES = [
  { valor: "#F5F5F0", nombre: "Blanco" },
  { valor: "#1A1A1A", nombre: "Negro" },
  { valor: "#8A9099", nombre: "Gris" },
  { valor: "#FFD23F", nombre: "Amarillo" },
  { valor: "#FF8C1A", nombre: "Naranja" },
  { valor: "#E8402E", nombre: "Rojo" },
  { valor: "#FF6FA8", nombre: "Rosado" },
  { valor: "#9B6BFF", nombre: "Morado" },
  { valor: "#2F6FE4", nombre: "Azul" },
  { valor: "#4CC9F0", nombre: "Celeste" },
  { valor: "#2DB84C", nombre: "Verde" },
  { valor: "#8B5A2B", nombre: "Café" },
] as const;

// Color con el que se empieza a escribir según el fondo.
export const colorInicial = (fondo: Fondo) => (fondo.oscuro ? COLORES[0].valor : COLORES[1].valor);

export const GROSORES = [
  { nombre: "Fino", lapiz: 3, resaltador: 16, texto: 24 },
  { nombre: "Medio", lapiz: 6, resaltador: 26, texto: 36 },
  { nombre: "Grueso", lapiz: 11, resaltador: 40, texto: 56 },
] as const;

export const LETRA = "'Chalkboard SE', 'Segoe Print', 'Bradley Hand', 'Comic Sans MS', ui-rounded, system-ui, sans-serif";
export const INTERLINEA = 1.25;

// Validación de lo que llega de la base de datos o del navegador.
const color = z.string().regex(/^#[0-9A-Fa-f]{6}$/);
const esquemaDibujo = z.object({
  v: z.literal(1),
  alto: z.number().min(ALTO_INICIAL).max(ALTO_MAXIMO),
  trazos: z
    .array(
      z.object({
        h: z.enum(["lapiz", "resaltador"]),
        c: color,
        g: z.number().positive().max(80),
        p: z.array(z.number().finite()).refine((p) => p.length % 3 === 0 && p.length >= 3),
      }),
    )
    .max(20000),
  textos: z
    .array(
      z.object({
        id: z.string().max(40),
        x: z.number().finite(),
        y: z.number().finite(),
        c: color,
        s: z.number().positive().max(120),
        t: z.string().max(5000),
      }),
    )
    .max(2000),
});

export function leerDibujo(valor: unknown): Dibujo {
  const r = esquemaDibujo.safeParse(valor);
  return r.success ? (r.data as Dibujo) : dibujoVacio();
}

const redondear = (n: number) => Math.round(n * 10) / 10;

// Agrega un punto al trazo si se movió lo suficiente desde el anterior.
export function agregarPunto(p: number[], x: number, y: number, presion: number, minimo = 1.2): boolean {
  const n = p.length;
  if (n >= 3 && Math.hypot(x - p[n - 3], y - p[n - 2]) < minimo) return false;
  p.push(redondear(x), redondear(y), Math.round(Math.min(1, Math.max(0, presion)) * 100) / 100);
  return true;
}

// Grosor de un tramo según la presión del lápiz (0,5 es lo normal).
export const grosorCon = (g: number, presion: number) => g * (0.45 + 1.1 * presion);

// Camino suave (SVG) que pasa por los puntos medios de cada par de puntos.
export function caminoSvg(p: number[]): string {
  const n = p.length / 3;
  if (n === 0) return "";
  if (n === 1) return `M${p[0]} ${p[1]}l0.01 0`;
  let d = `M${p[0]} ${p[1]}`;
  for (let i = 1; i < n - 1; i++) {
    const x = p[i * 3];
    const y = p[i * 3 + 1];
    const mx = redondear((x + p[(i + 1) * 3]) / 2);
    const my = redondear((y + p[(i + 1) * 3 + 1]) / 2);
    d += `Q${x} ${y} ${mx} ${my}`;
  }
  d += `L${p[(n - 1) * 3]} ${p[(n - 1) * 3 + 1]}`;
  return d;
}

// Caja aproximada de un texto (para borrar y para tocarlo y editarlo).
export function cajaTexto(t: Texto, medir?: (linea: string) => number) {
  const lineas = t.t.split("\n");
  const ancho = Math.max(...lineas.map((l) => (medir ? medir(l) : l.length * t.s * 0.55)), t.s * 0.5);
  return { x: t.x, y: t.y, ancho, alto: lineas.length * t.s * INTERLINEA };
}

export const dentroDe = (c: { x: number; y: number; ancho: number; alto: number }, x: number, y: number, margen = 0) =>
  x >= c.x - margen && x <= c.x + c.ancho + margen && y >= c.y - margen && y <= c.y + c.alto + margen;

// ¿El borrador en (x, y) con radio r toca el trazo?
export function tocaTrazo(trazo: Trazo, x: number, y: number, r: number): boolean {
  const p = trazo.p;
  const alcance = r + trazo.g / 2;
  for (let i = 0; i < p.length; i += 3) {
    if (i + 3 < p.length) {
      if (distanciaASegmento(x, y, p[i], p[i + 1], p[i + 3], p[i + 4]) <= alcance) return true;
    } else if (Math.hypot(x - p[i], y - p[i + 1]) <= alcance) return true;
  }
  return false;
}

function distanciaASegmento(px: number, py: number, ax: number, ay: number, bx: number, by: number) {
  const dx = bx - ax;
  const dy = by - ay;
  const largo = dx * dx + dy * dy;
  const t = largo === 0 ? 0 : Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / largo));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

// Alto que necesita el contenido (para la miniatura).
export function altoUsado(d: Dibujo): number {
  let max = 0;
  for (const t of d.trazos) for (let i = 1; i < t.p.length; i += 3) max = Math.max(max, t.p[i] + t.g);
  for (const t of d.textos) max = Math.max(max, t.y + cajaTexto(t).alto);
  return max;
}
