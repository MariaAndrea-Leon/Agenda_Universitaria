"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import {
  agregarPunto,
  ALTO_EXTRA,
  cajaObjeto,
  letraEnlace,
  type Objeto,
  puntasFlecha,
  URL_IMAGEN,
  ALTO_MAXIMO,
  ANCHO,
  cajaTexto,
  colorInicial,
  COLORES,
  CUADRO,
  dentroDe,
  type Dibujo,
  type Fondo,
  fondoDe,
  FONDOS,
  type FondoId,
  grosorCon,
  GROSORES,
  esEnlaceSeguro,
  INTERLINEA,
  leerDibujo,
  tocaObjeto,
  type TipoFigura,
  LETRA,
  type Texto,
  tocaTrazo,
  type Trazo,
} from "@/lib/pizarron";

type Herramienta = "seleccionar" | "lapiz" | "resaltador" | "texto" | "figura" | "borrador" | "mover";
type Estado = "guardado" | "pendiente" | "guardando" | "error";

const HERRAMIENTAS: { id: Herramienta; nombre: string; trazo: string }[] = [
  { id: "seleccionar", nombre: "Seleccionar, mover y cambiar tamaño", trazo: "M5 3l13 7.5-5.5 1.5L10 18z" },
  { id: "lapiz", nombre: "Lápiz", trazo: "M4 20l4-1L19 8l-3-3L5 16l-1 4zM14 7l3 3" },
  { id: "resaltador", nombre: "Resaltador", trazo: "M4 20h7M6 17l-2 3M9 14l-3 3 2 2 3-3M9 14l7-9 4 4-9 7M9 14l2 2" },
  { id: "texto", nombre: "Texto con teclado", trazo: "M5 7V5h14v2M12 5v14M9 19h6" },
  { id: "figura", nombre: "Figuras", trazo: "M4 4h7v7H4zM17.5 17.5m-3.5 0a3.5 3.5 0 1 0 7 0a3.5 3.5 0 1 0-7 0" },
  { id: "borrador", nombre: "Borrador", trazo: "M9 20h11M4.5 15.5l9-9 6 6-7.5 7.5H8z M10 10l6 6" },
  { id: "mover", nombre: "Mover la hoja", trazo: "M12 3v18M3 12h18M9 6l3-3 3 3M9 18l3 3 3-3M6 9l-3 3 3 3M18 9l3 3-3 3" },
];

const FIGURAS: { id: TipoFigura; nombre: string; trazo: string }[] = [
  { id: "rect", nombre: "Rectángulo", trazo: "M4 6h16v12H4z" },
  { id: "elipse", nombre: "Círculo u óvalo", trazo: "M12 5c5 0 9 3.1 9 7s-4 7-9 7-9-3.1-9-7 4-7 9-7z" },
  { id: "linea", nombre: "Línea", trazo: "M5 19 19 5" },
  { id: "flecha", nombre: "Flecha", trazo: "M5 19 19 5M10 5h9v9" },
];

// Puntos para agarrar una figura seleccionada y cambiarla.
type ModoArrastre = "mover" | "tamano" | "inicio" | "crear";
interface Arrastre {
  modo: ModoArrastre;
  id: string;
  x0: number;
  y0: number;
  original: Objeto | Texto;
  actual: Objeto | Texto;
  antes: string;
}
const esTexto = (e: Objeto | Texto): e is Texto => !("tipo" in e);
const nuevoId = () => (crypto.randomUUID?.() ?? Math.random().toString(16).slice(2) + Date.now().toString(16)).slice(0, 8);
// Corta una petición que no responde (AbortSignal.timeout falta en iPhone viejos).
function conLimite(ms: number) {
  const control = new AbortController();
  setTimeout(() => control.abort(), ms);
  return control.signal;
}
// URL.canParse no existe en iPhone con iOS anterior al 17.
const sePuedeLeer = (url: string) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

const ESTADOS: Record<Estado, string> = {
  guardado: "Guardado",
  pendiente: "Cambios sin guardar",
  guardando: "Guardando…",
  error: "Sin guardar; reintentando",
};

const RADIO_BORRADOR = 14;
const LIMITE_HISTORIAL = 60;

function Icono({ trazo }: { trazo: string }) {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={trazo} />
    </svg>
  );
}

// Pintura en un canvas, con k = píxeles por unidad de la hoja.
function pintarFondo(ctx: CanvasRenderingContext2D, fondo: Fondo, alto: number, k: number) {
  ctx.fillStyle = fondo.base;
  ctx.fillRect(0, 0, ANCHO * k, alto * k);
  if (fondo.tipo === "liso") return;
  ctx.strokeStyle = fondo.linea;
  ctx.lineWidth = Math.max(1, 1.5 * k);
  ctx.beginPath();
  const paso = fondo.tipo === "rayas" ? CUADRO * 1.6 : CUADRO;
  for (let y = paso; y < alto; y += paso) {
    ctx.moveTo(0, y * k);
    ctx.lineTo(ANCHO * k, y * k);
  }
  if (fondo.tipo === "cuadros") {
    for (let x = CUADRO; x < ANCHO; x += CUADRO) {
      ctx.moveTo(x * k, 0);
      ctx.lineTo(x * k, alto * k);
    }
  }
  ctx.stroke();
}

function pintarTrazo(ctx: CanvasRenderingContext2D, t: Trazo, k: number) {
  const p = t.p;
  const n = p.length / 3;
  if (n === 0) return;
  ctx.save();
  ctx.scale(k, k);
  ctx.strokeStyle = t.c;
  ctx.fillStyle = t.c;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  if (n === 1) {
    ctx.globalAlpha = t.h === "resaltador" ? 0.35 : 1;
    ctx.beginPath();
    ctx.arc(p[0], p[1], (t.h === "resaltador" ? t.g : grosorCon(t.g, p[2])) / 2, 0, Math.PI * 2);
    ctx.fill();
  } else if (t.h === "resaltador") {
    // Un solo trazo para que la transparencia no se acumule.
    ctx.globalAlpha = 0.35;
    ctx.lineWidth = t.g;
    ctx.beginPath();
    ctx.moveTo(p[0], p[1]);
    for (let i = 1; i < n - 1; i++) {
      ctx.quadraticCurveTo(p[i * 3], p[i * 3 + 1], (p[i * 3] + p[(i + 1) * 3]) / 2, (p[i * 3 + 1] + p[(i + 1) * 3 + 1]) / 2);
    }
    ctx.lineTo(p[(n - 1) * 3], p[(n - 1) * 3 + 1]);
    ctx.stroke();
  } else {
    // Tramo por tramo, para que el grosor siga la presión del lápiz.
    let x0 = p[0];
    let y0 = p[1];
    for (let i = 1; i < n; i++) {
      const fin = i === n - 1;
      const x1 = fin ? p[i * 3] : (p[i * 3] + p[(i + 1) * 3]) / 2;
      const y1 = fin ? p[i * 3 + 1] : (p[i * 3 + 1] + p[(i + 1) * 3 + 1]) / 2;
      ctx.lineWidth = grosorCon(t.g, (p[(i - 1) * 3 + 2] + p[i * 3 + 2]) / 2);
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      if (fin) ctx.lineTo(x1, y1);
      else ctx.quadraticCurveTo(p[i * 3], p[i * 3 + 1], x1, y1);
      ctx.stroke();
      x0 = x1;
      y0 = y1;
    }
  }
  ctx.restore();
}

function pintarTexto(ctx: CanvasRenderingContext2D, t: Texto, k: number) {
  ctx.save();
  ctx.scale(k, k);
  ctx.fillStyle = t.c;
  ctx.font = `${t.s}px ${LETRA}`;
  ctx.textBaseline = "top";
  t.t.split("\n").forEach((linea, i) => ctx.fillText(linea, t.x, t.y + i * t.s * INTERLINEA));
  ctx.restore();
}

// Imágenes ya descargadas, para pintarlas sin volver a pedirlas.
const imagenes = new Map<string, HTMLImageElement>();
export function imagenDe(ruta: string, alCargar?: () => void, origen = URL_IMAGEN(ruta)) {
  let img = imagenes.get(ruta);
  if (!img) {
    img = new Image();
    img.decoding = "async";
    img.src = origen;
    imagenes.set(ruta, img);
  }
  if (alCargar && !img.complete) img.addEventListener("load", alCargar, { once: true });
  return img;
}

// Espera a que carguen las imágenes del dibujo (para descargarlo).
export function cargarImagenes(d: Dibujo) {
  return Promise.all(
    d.objetos.flatMap((o) =>
      o.tipo === "imagen" && o.ruta
        ? [
            new Promise<void>((listo) => {
              const img = imagenDe(o.ruta!);
              if (img.complete) listo();
              else {
                img.addEventListener("load", () => listo(), { once: true });
                img.addEventListener("error", () => listo(), { once: true });
              }
            }),
          ]
        : [],
    ),
  );
}

export function pintarObjeto(ctx: CanvasRenderingContext2D, o: Objeto, k: number, alCargar?: () => void) {
  ctx.save();
  ctx.scale(k, k);
  ctx.strokeStyle = o.c;
  ctx.fillStyle = o.c;
  ctx.lineWidth = o.g;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  const c = cajaObjeto(o);
  if (o.tipo === "rect" || o.tipo === "elipse") {
    ctx.beginPath();
    if (o.tipo === "rect") ctx.rect(c.x, c.y, c.ancho, c.alto);
    else ctx.ellipse(c.x + c.ancho / 2, c.y + c.alto / 2, c.ancho / 2, c.alto / 2, 0, 0, Math.PI * 2);
    if (o.f) {
      ctx.globalAlpha = 0.25;
      ctx.fillStyle = o.f;
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    ctx.stroke();
  } else if (o.tipo === "linea" || o.tipo === "flecha") {
    ctx.beginPath();
    ctx.moveTo(o.x, o.y);
    ctx.lineTo(o.x + o.w, o.y + o.h);
    if (o.tipo === "flecha") {
      const p = puntasFlecha(o);
      ctx.moveTo(...p.a);
      ctx.lineTo(p.x2, p.y2);
      ctx.lineTo(...p.b);
    }
    ctx.stroke();
  } else if (o.tipo === "imagen" && o.ruta) {
    const img = imagenDe(o.ruta, alCargar);
    if (img.complete && img.naturalWidth) ctx.drawImage(img, c.x, c.y, c.ancho, c.alto);
    else {
      ctx.globalAlpha = 0.15;
      ctx.fillRect(c.x, c.y, c.ancho, c.alto);
    }
  } else if (o.tipo === "enlace") {
    const s = letraEnlace(o);
    ctx.globalAlpha = 0.12;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(c.x, c.y, c.ancho, c.alto, s * 0.4);
    else ctx.rect(c.x, c.y, c.ancho, c.alto);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.font = `600 ${s}px system-ui, sans-serif`;
    ctx.textBaseline = "middle";
    const texto = `🔗 ${o.t || o.url}`;
    ctx.save();
    ctx.beginPath();
    ctx.rect(c.x, c.y, c.ancho, c.alto);
    ctx.clip();
    ctx.fillText(texto, c.x + s * 0.4, c.y + c.alto / 2);
    ctx.restore();
    ctx.lineWidth = Math.max(1, s / 14);
    ctx.beginPath();
    const ancho = Math.min(ctx.measureText(texto).width, c.ancho - s * 0.8);
    ctx.moveTo(c.x + s * 0.4, c.y + c.alto / 2 + s * 0.6);
    ctx.lineTo(c.x + s * 0.4 + ancho, c.y + c.alto / 2 + s * 0.6);
    ctx.stroke();
  }
  ctx.restore();
}

function buscar(d: Dibujo, id: string | null): Objeto | Texto | undefined {
  if (!id) return undefined;
  return d.objetos.find((o) => o.id === id) ?? d.textos.find((t) => t.id === id);
}

const cajaDe = (e: Objeto | Texto) => (esTexto(e) ? cajaTexto(e, medirCon(e.s)) : cajaObjeto(e));

// Puntos para cambiar el tamaño (o las puntas de una línea).
function agarraderas(e: Objeto | Texto): { modo: ModoArrastre; x: number; y: number }[] {
  if (esTexto(e)) return [];
  if (e.tipo === "linea" || e.tipo === "flecha") {
    return [
      { modo: "inicio", x: e.x, y: e.y },
      { modo: "tamano", x: e.x + e.w, y: e.y + e.h },
    ];
  }
  const c = cajaObjeto(e);
  return [{ modo: "tamano", x: c.x + c.ancho, y: c.y + c.alto }];
}

function pintarSeleccion(ctx: CanvasRenderingContext2D, e: Objeto | Texto, k: number) {
  const c = cajaDe(e);
  ctx.save();
  ctx.strokeStyle = "#2F6FE4";
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 4]);
  const m = 6;
  if (esTexto(e) || (e.tipo !== "linea" && e.tipo !== "flecha")) {
    ctx.strokeRect((c.x - m) * k, (c.y - m) * k, (c.ancho + m * 2) * k, (c.alto + m * 2) * k);
  }
  ctx.setLineDash([]);
  for (const p of agarraderas(e)) {
    ctx.beginPath();
    ctx.arc(p.x * k, p.y * k, 10 * (window.devicePixelRatio || 1), 0, Math.PI * 2);
    ctx.fillStyle = "#FFFFFF";
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
}

// Achica una foto antes de subirla (máximo 1600 px de lado) para que suba
// rápido desde el celular y ocupe poco en la nube.
async function achicarImagen(archivo: Blob): Promise<{ blob: Blob; ancho: number; alto: number }> {
  const url = URL.createObjectURL(archivo);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    const escala = Math.min(1, 1600 / Math.max(img.naturalWidth, img.naturalHeight));
    const ancho = Math.max(1, Math.round(img.naturalWidth * escala));
    const alto = Math.max(1, Math.round(img.naturalHeight * escala));
    const c = document.createElement("canvas");
    c.width = ancho;
    c.height = alto;
    c.getContext("2d")!.drawImage(img, 0, 0, ancho, alto);
    const comoBlob = (tipo: string) => new Promise<Blob | null>((listo) => c.toBlob(listo, tipo, 0.82));
    // Safari en iPhone no sabe hacer WebP: ahí sale JPG.
    let blob = await comoBlob("image/webp");
    if (blob?.type !== "image/webp") blob = await comoBlob("image/jpeg");
    if (!blob) throw new Error("No se pudo leer la imagen.");
    return { blob, ancho, alto };
  } catch (error) {
    throw error instanceof Error && error.message.startsWith("No se") ? error : new Error("Ese archivo no es una imagen que se pueda abrir.");
  } finally {
    URL.revokeObjectURL(url);
  }
}

// Ancho que necesita la caja de un enlace con su texto.
export function anchoEnlace(t: string, s: number) {
  return Math.min(ANCHO - 20, medirCon(s, "600")(`🔗 ${t}`) + s * 0.8);
}

export function pintarTodo(
  ctx: CanvasRenderingContext2D,
  d: Dibujo,
  fondo: Fondo,
  k: number,
  ocultar?: string,
  alCargar?: () => void,
) {
  pintarFondo(ctx, fondo, d.alto, k);
  for (const o of d.objetos) if (o.id !== ocultar) pintarObjeto(ctx, o, k, alCargar);
  for (const t of d.trazos) pintarTrazo(ctx, t, k);
  for (const t of d.textos) if (t.id !== ocultar) pintarTexto(ctx, t, k);
}

let medidor: CanvasRenderingContext2D | null = null;
function medirCon(s: number, peso = "") {
  medidor ??= document.createElement("canvas").getContext("2d");
  return (linea: string) => {
    if (!medidor) return linea.length * s * 0.55;
    medidor.font = peso ? `${peso} ${s}px system-ui, sans-serif` : `${s}px ${LETRA}`;
    return medidor.measureText(linea).width;
  };
}

interface EdicionTexto {
  id: string;
  x: number;
  y: number;
  c: string;
  s: number;
  valor: string;
}

export interface ApunteEditable {
  id: string;
  materia_id: string;
  titulo: string | null;
  fecha: string;
  fondo: string;
  editado_en: string;
}

export function EditorPizarron({
  apunte,
  dibujo: inicial,
  materia,
  children,
}: {
  apunte: ApunteEditable;
  dibujo: Dibujo;
  materia: { nombre: string; color: string };
  children?: React.ReactNode;
}) {
  const doc = useRef<Dibujo>(inicial);
  const [version, setVersion] = useState(0);
  const [fondoId, setFondoId] = useState<FondoId>(fondoDe(apunte.fondo).id);
  const fondo = fondoDe(fondoId);
  const [herramienta, setHerramienta] = useState<Herramienta>("lapiz");
  const [color, setColor] = useState<string>(colorInicial(fondo));
  const [grosor, setGrosor] = useState(1);
  const [titulo, setTitulo] = useState(apunte.titulo ?? "");
  const [fecha, setFecha] = useState(apunte.fecha);
  const [estado, setEstado] = useState<Estado>("guardado");
  const [motivo, setMotivo] = useState("");
  const [edicion, setEdicion] = useState<EdicionTexto | null>(null);
  const [escala, setEscala] = useState(0);
  const [historial, setHistorial] = useState({ atras: 0, adelante: 0 });

  const contenedor = useRef<HTMLDivElement>(null);
  const lienzo = useRef<HTMLCanvasElement>(null);
  const base = useRef<HTMLCanvasElement | null>(null);
  const areaTexto = useRef<HTMLTextAreaElement>(null);
  const atras = useRef<string[]>([]);
  const adelante = useRef<string[]>([]);
  const trazo = useRef<Trazo | null>(null);
  const toques = useRef(new Map<number, number>());
  const lapizVisto = useRef(false);
  const borrando = useRef<{ antes: string; cambio: boolean } | null>(null);
  const primeraVez = useRef(true);
  const [figura, setFigura] = useState<TipoFigura>("rect");
  const [seleccion, setSeleccion] = useState<string | null>(null);
  const arrastre = useRef<Arrastre | null>(null);
  const [formEnlace, setFormEnlace] = useState<{ url: string; t: string; id?: string } | null>(null);
  const [aviso, setAviso] = useState("");
  const archivoImagen = useRef<HTMLInputElement>(null);
  const seleccionActual = useRef(seleccion);
  seleccionActual.current = seleccion;


  // Ajusta el tamaño del lienzo al ancho disponible.
  useLayoutEffect(() => {
    const el = contenedor.current;
    if (!el) return;
    const medir = () => setEscala(el.clientWidth / ANCHO);
    medir();
    const obs = new ResizeObserver(medir);
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const pintarVista = useCallback(() => {
    const c = lienzo.current;
    const b = base.current;
    if (!c || !b) return;
    const ctx = c.getContext("2d")!;
    const k = escala * (window.devicePixelRatio || 1);
    ctx.drawImage(b, 0, 0);
    const a = arrastre.current;
    if (a) {
      if (esTexto(a.actual)) pintarTexto(ctx, a.actual, k);
      else pintarObjeto(ctx, a.actual, k);
    }
    if (trazo.current) pintarTrazo(ctx, trazo.current, k);
    const sel = a && a.modo !== "crear" ? a.actual : buscar(doc.current, seleccionActual.current);
    if (sel) pintarSeleccion(ctx, sel, k);
  }, [escala]);

  const pintarBase = useCallback(() => {
    const c = lienzo.current;
    if (!c || !escala) return;
    const factor = escala * (window.devicePixelRatio || 1);
    const w = Math.round(ANCHO * factor);
    const h = Math.round(doc.current.alto * factor);
    if (c.width !== w || c.height !== h) {
      c.width = w;
      c.height = h;
    }
    base.current ??= document.createElement("canvas");
    const b = base.current;
    b.width = w;
    b.height = h;
    pintarTodo(b.getContext("2d")!, doc.current, fondo, factor, arrastre.current?.id ?? edicion?.id, () => repintar.current());
    pintarVista();
  }, [escala, fondo, edicion?.id, pintarVista]);
  const repintar = useRef(pintarBase);
  repintar.current = pintarBase;

  useEffect(() => {
    pintarVista();
  }, [seleccion, pintarVista]);

  useEffect(() => {
    pintarBase();
  }, [pintarBase, version]);

  // La letra a mano puede tardar en cargar; se repinta cuando llega.
  useEffect(() => {
    document.fonts?.ready.then(() => pintarBase());
  }, [pintarBase]);

  // Guardado automático un momento después de cada cambio. Mientras no se
  // guarde, queda una copia en este equipo para no perder nada si se cierra
  // la app o se va la conexión.
  const copiaLocal = `agenda:apunte:${apunte.id}`;
  const datosParaGuardar = useRef({ titulo, fecha, fondoId });
  datosParaGuardar.current = { titulo, fecha, fondoId };
  const cambios = useRef(0);
  const guardados = useRef(0);
  const enCurso = useRef<Promise<boolean>>(Promise.resolve(true));

  const guardar = useCallback(() => {
    // Uno a la vez, para que un guardado viejo no pise uno nuevo.
    enCurso.current = enCurso.current.then(async () => {
      const hasta = cambios.current;
      if (hasta === guardados.current) return true;
      setEstado("guardando");
      const { titulo, fecha, fondoId } = datosParaGuardar.current;
      let fallo = "";
      try {
        const cuerpo = JSON.stringify({ titulo, fecha, fondo: fondoId, dibujo: doc.current });
        const respuesta = await fetch(`/api/apuntes/${apunte.id}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: cuerpo,
          // Así termina aunque se cierre la app (el navegador solo lo permite
          // con apuntes pequeños).
          keepalive: cuerpo.length < 60000,
          // Nunca se queda esperando: si no responde, se reintenta.
          signal: conLimite(20000),
        });
        if (!respuesta.ok) {
          const r = await respuesta.json().catch(() => null);
          fallo = r?.error || `El servidor respondió ${respuesta.status}.`;
        }
      } catch {
        fallo = navigator.onLine
          ? "La conexión está lenta o se cortó. Tus cambios quedan en este equipo y se vuelve a intentar."
          : "Sin conexión. Tus cambios quedan en este equipo y se guardan al volver la conexión.";
      }
      if (fallo) {
        setMotivo(fallo.startsWith("Motivo") ? `No se pudo guardar. ${fallo}` : fallo);
        setEstado("error");
        return false;
      }
      guardados.current = hasta;
      if (hasta === cambios.current) {
        setEstado("guardado");
        try {
          localStorage.removeItem(copiaLocal);
        } catch {}
      }
      return true;
    }, () => false);
    return enCurso.current;
  }, [apunte.id, copiaLocal]);

  // Si quedó una copia sin guardar más nueva que la de la nube, la recupera.
  useEffect(() => {
    try {
      const copia = JSON.parse(localStorage.getItem(copiaLocal) ?? "null");
      if (!copia || !(copia.en > Date.parse(apunte.editado_en))) return;
      doc.current = leerDibujo(copia.dibujo);
      setTitulo(copia.titulo ?? "");
      setFecha(copia.fecha || apunte.fecha);
      setFondoId(fondoDe(copia.fondo).id);
      setVersion((v) => v + 1);
    } catch {}
  }, [apunte.editado_en, apunte.fecha, copiaLocal]);

  useEffect(() => {
    if (primeraVez.current) {
      primeraVez.current = false;
      return;
    }
    cambios.current++;
    setEstado("pendiente");
    try {
      localStorage.setItem(
        copiaLocal,
        JSON.stringify({ en: Date.now(), dibujo: doc.current, titulo, fecha, fondo: fondoId }),
      );
    } catch {}
    let reintento: ReturnType<typeof setTimeout>;
    const intentar = async () => {
      if (!(await guardar())) reintento = setTimeout(intentar, 5000);
    };
    const espera = setTimeout(intentar, 1000);
    return () => {
      clearTimeout(espera);
      clearTimeout(reintento);
    };
  }, [version, titulo, fecha, fondoId, guardar, copiaLocal]);

  useEffect(() => {
    if (estado === "guardado") return;
    const avisar = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", avisar);
    return () => window.removeEventListener("beforeunload", avisar);
  }, [estado]);

  const recordar = (antes = JSON.stringify(doc.current)) => {
    atras.current.push(antes);
    if (atras.current.length > LIMITE_HISTORIAL) atras.current.shift();
    adelante.current = [];
    setHistorial({ atras: atras.current.length, adelante: 0 });
  };
  const cambio = () => setVersion((v) => v + 1);

  const moverEnHistorial = useCallback((desde: React.RefObject<string[]>, hacia: React.RefObject<string[]>) => {
    const previo = desde.current.pop();
    if (!previo) return;
    hacia.current.push(JSON.stringify(doc.current));
    doc.current = JSON.parse(previo);
    setHistorial({ atras: atras.current.length, adelante: adelante.current.length });
    setVersion((v) => v + 1);
  }, []);
  const deshacer = useCallback(() => moverEnHistorial(atras, adelante), [moverEnHistorial]);
  const rehacer = useCallback(() => moverEnHistorial(adelante, atras), [moverEnHistorial]);

  const borrarSeleccion = useCallback(() => {
    const id = seleccionActual.current;
    if (!id) return;
    recordar();
    const d = doc.current;
    doc.current = { ...d, objetos: d.objetos.filter((o) => o.id !== id), textos: d.textos.filter((t) => t.id !== id) };
    setSeleccion(null);
    cambio();
  }, []);

  useEffect(() => {
    const teclas = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest("input, textarea, select")) return;
      if ((e.key === "Delete" || e.key === "Backspace") && seleccionActual.current) {
        e.preventDefault();
        borrarSeleccion();
        return;
      }
      if (!(e.ctrlKey || e.metaKey)) return;
      const z = e.key.toLowerCase() === "z";
      if (z && !e.shiftKey) deshacer();
      else if ((z && e.shiftKey) || e.key.toLowerCase() === "y") rehacer();
      else return;
      e.preventDefault();
    };
    window.addEventListener("keydown", teclas);
    return () => window.removeEventListener("keydown", teclas);
  }, [deshacer, rehacer, borrarSeleccion]);

  // Textos con teclado ------------------------------------------------------
  const edicionActual = useRef(edicion);
  edicionActual.current = edicion;
  const terminarTexto = useCallback(() => {
    const e = edicionActual.current;
    if (!e) return;
    edicionActual.current = null;
    setEdicion(null);
    const valor = e.valor.replace(/\s+$/, "");
    const previo = doc.current.textos.find((t) => t.id === e.id);
    if (previo ? previo.t === valor : !valor) return;
    recordar();
    const textos = doc.current.textos.filter((t) => t.id !== e.id);
    if (valor) textos.push({ id: e.id, x: e.x, y: e.y, c: e.c, s: e.s, t: valor });
    doc.current = { ...doc.current, textos };
    cambio();
  }, []);

  // Al salir del pizarrón (otro enlace, cerrar o cambiar de app) guarda de
  // una vez lo que falte, incluido un texto que se esté escribiendo.
  const router = useRouter();
  useEffect(() => {
    const guardarYa = () => {
      if (edicionActual.current) {
        terminarTexto();
        cambios.current++;
      }
      if (cambios.current !== guardados.current) return guardar();
    };
    const alOcultar = () => {
      if (document.visibilityState === "hidden") guardarYa();
    };
    document.addEventListener("visibilitychange", alOcultar);
    window.addEventListener("pagehide", guardarYa);
    const alVolverLaRed = () => void guardar();
    window.addEventListener("online", alVolverLaRed);
    return () => {
      document.removeEventListener("visibilitychange", alOcultar);
      window.removeEventListener("pagehide", guardarYa);
      window.removeEventListener("online", alVolverLaRed);
      // Al volver a la materia, la miniatura muestra lo último.
      guardarYa()?.then((ok) => ok && router.refresh());
    };
  }, [guardar, terminarTexto, router]);

  const textoEn = (x: number, y: number) =>
    [...doc.current.textos].reverse().find((t) => dentroDe(cajaTexto(t, medirCon(t.s)), x, y, 6));

  const abrirTexto = (x: number, y: number) => {
    const existente = textoEn(x, y);
    const s = GROSORES[grosor].texto;
    const nueva: EdicionTexto = existente
      ? { id: existente.id, x: existente.x, y: existente.y, c: existente.c, s: existente.s, valor: existente.t }
      : { id: nuevoId(), x: Math.round(x), y: Math.round(Math.max(0, y - s * 0.6)), c: color, s, valor: "" };
    // flushSync + focus en el mismo toque para que el celular abra el teclado.
    flushSync(() => setEdicion(nueva));
    areaTexto.current?.focus();
  };

  // Lápiz, dedo y mouse -------------------------------------------------------
  const punto = (e: { clientX: number; clientY: number }) => {
    const r = lienzo.current!.getBoundingClientRect();
    return { x: (e.clientX - r.left) / escala, y: (e.clientY - r.top) / escala };
  };

  const borrarEn = (x: number, y: number) => {
    const d = doc.current;
    const trazos = d.trazos.filter((t) => !tocaTrazo(t, x, y, RADIO_BORRADOR));
    const textos = d.textos.filter((t) => !dentroDe(cajaTexto(t, medirCon(t.s)), x, y, RADIO_BORRADOR / 2));
    const objetos = d.objetos.filter((o) => !tocaObjeto(o, x, y, RADIO_BORRADOR / 2));
    if (trazos.length === d.trazos.length && textos.length === d.textos.length && objetos.length === d.objetos.length) return;
    doc.current = { ...d, objetos, trazos, textos };
    if (borrando.current) borrando.current.cambio = true;
    pintarBase();
  };

  // Seleccionar, mover, cambiar tamaño y crear figuras ---------------------
  const empezarArrastre = (x: number, y: number) => {
    const antes = JSON.stringify(doc.current);
    if (herramienta === "figura") {
      const o: Objeto = { id: nuevoId(), tipo: figura, x, y, w: 0, h: 0, c: color, g: GROSORES[grosor].lapiz, f: null };
      arrastre.current = { modo: "crear", id: o.id, x0: x, y0: y, original: o, actual: o, antes };
      setSeleccion(null);
      pintarVista();
      return;
    }
    const radio = 24 / escala;
    const actual = buscar(doc.current, seleccion);
    const agarre = actual && agarraderas(actual).find((p) => Math.hypot(p.x - x, p.y - y) <= radio);
    const elegido =
      agarre || (actual && dentroDe(cajaDe(actual), x, y, 8) && (esTexto(actual) || tocaObjeto(actual, x, y, 8)))
        ? actual
        : ([...doc.current.textos].reverse().find((t) => dentroDe(cajaTexto(t, medirCon(t.s)), x, y, 6)) ??
          [...doc.current.objetos].reverse().find((o) => tocaObjeto(o, x, y, 4)));
    if (!elegido) {
      setSeleccion(null);
      return;
    }
    setSeleccion(elegido.id);
    arrastre.current = { modo: agarre ? agarre.modo : "mover", id: elegido.id, x0: x, y0: y, original: elegido, actual: elegido, antes };
    pintarBase();
  };

  const moverArrastre = (x: number, y: number) => {
    const a = arrastre.current!;
    const dx = x - a.x0;
    const dy = y - a.y0;
    const o = a.original;
    if (a.modo === "mover") a.actual = { ...o, x: Math.round(o.x + dx), y: Math.round(o.y + dy) };
    else if (!esTexto(o)) {
      if (a.modo === "crear") a.actual = { ...o, w: Math.round(x - o.x), h: Math.round(y - o.y) };
      else if (a.modo === "inicio") a.actual = { ...o, x: Math.round(o.x + dx), y: Math.round(o.y + dy), w: Math.round(o.w - dx), h: Math.round(o.h - dy) };
      else if (o.tipo === "linea" || o.tipo === "flecha") a.actual = { ...o, w: Math.round(o.w + dx), h: Math.round(o.h + dy) };
      else if (o.tipo === "imagen" || o.tipo === "enlace") {
        // Sin deformar: el alto sigue al ancho.
        const w = Math.max(40, Math.round(o.w + dx));
        a.actual = { ...o, w, h: Math.round((w * o.h) / o.w) };
      } else a.actual = { ...o, w: Math.max(10, Math.round(o.w + dx)), h: Math.max(10, Math.round(o.h + dy)) };
    }
    pintarVista();
  };

  const terminarArrastre = () => {
    const a = arrastre.current!;
    arrastre.current = null;
    let nuevo = a.actual;
    if (a.modo === "crear" && !esTexto(nuevo)) {
      const linea = nuevo.tipo === "linea" || nuevo.tipo === "flecha";
      // Un toque sin arrastrar pone la figura de un tamaño cómodo.
      if (Math.abs(nuevo.w) < 8 && Math.abs(nuevo.h) < 8) nuevo = { ...nuevo, w: linea ? 200 : 180, h: linea ? 0 : 110 };
      else if (!linea) {
        const c = cajaObjeto(nuevo);
        nuevo = { ...nuevo, x: c.x, y: c.y, w: Math.max(10, c.ancho), h: Math.max(10, c.alto) };
      }
      recordar(a.antes);
      doc.current = { ...doc.current, objetos: [...doc.current.objetos, nuevo] };
      setSeleccion(nuevo.id);
      setHerramienta("seleccionar");
      cambio();
      return;
    }
    if (JSON.stringify(nuevo) === JSON.stringify(a.original)) {
      pintarBase();
      return;
    }
    recordar(a.antes);
    reemplazar(nuevo);
  };

  // Cambia un objeto o texto del dibujo por su versión nueva.
  const reemplazar = (nuevo: Objeto | Texto) => {
    const d = doc.current;
    doc.current = esTexto(nuevo)
      ? { ...d, textos: d.textos.map((t) => (t.id === nuevo.id ? nuevo : t)) }
      : { ...d, objetos: d.objetos.map((o) => (o.id === nuevo.id ? nuevo : o)) };
    cambio();
  };

  const cambiarSeleccion = (cambiar: (e: Objeto | Texto) => Objeto | Texto | null) => {
    const actual = buscar(doc.current, seleccion);
    if (!actual) return false;
    const nuevo = cambiar(actual);
    if (!nuevo || JSON.stringify(nuevo) === JSON.stringify(actual)) return true;
    recordar();
    reemplazar(nuevo);
    return true;
  };

  const elegirColor = (c: string) => {
    setColor(c);
    cambiarSeleccion((e) => (esTexto(e) ? { ...e, c } : { ...e, c, f: e.f ? c : e.f }));
  };

  const elegirGrosor = (i: number) => {
    setGrosor(i);
    cambiarSeleccion((e) =>
      esTexto(e) ? { ...e, s: GROSORES[i].texto } : e.tipo === "imagen" || e.tipo === "enlace" ? null : { ...e, g: GROSORES[i].lapiz },
    );
  };


  const alFrente = () => {
    const actual = buscar(doc.current, seleccion);
    if (!actual || esTexto(actual)) return;
    recordar();
    doc.current = { ...doc.current, objetos: [...doc.current.objetos.filter((o) => o.id !== actual.id), actual] };
    cambio();
  };

  // Dónde poner lo que se agrega: arriba de la parte de la hoja que se ve.
  const puntoVisible = () => {
    const r = lienzo.current?.getBoundingClientRect();
    let y = Math.round(Math.min(Math.max(20, r ? (Math.max(0, -r.top) + 90) / escala : 60), doc.current.alto - 150));
    let x = 60;
    // Si ya hay algo justo ahí, corre lo nuevo un poco para que no quede tapado.
    const ocupado = (px: number, py: number) =>
      doc.current.objetos.some((o) => Math.abs(o.x - px) < 10 && Math.abs(o.y - py) < 10) ||
      doc.current.textos.some((t) => Math.abs(t.x - px) < 10 && Math.abs(t.y - py) < 10);
    for (let i = 0; i < 20 && ocupado(x, y); i++) {
      x += 30;
      y += 30;
    }
    return { x, y };
  };

  const agregarObjeto = (o: Objeto) => {
    recordar();
    doc.current = { ...doc.current, objetos: [...doc.current.objetos, o] };
    setSeleccion(o.id);
    setHerramienta("seleccionar");
    cambio();
  };

  const agregarTextoPegado = (texto: string) => {
    const s = GROSORES[grosor].texto;
    const { x, y } = puntoVisible();
    const medir = medirCon(s);
    // Corta las líneas largas para que quepan en la hoja.
    const lineas = texto
      .replace(/\r/g, "")
      .split("\n")
      .flatMap((linea) => {
        const partes: string[] = [];
        let actual = "";
        for (const palabra of linea.split(" ")) {
          const prueba = actual ? `${actual} ${palabra}` : palabra;
          if (actual && medir(prueba) > ANCHO - x - 30) {
            partes.push(actual);
            actual = palabra;
          } else actual = prueba;
        }
        return [...partes, actual];
      });
    const t: Texto = { id: nuevoId(), x, y, c: color, s, t: lineas.join("\n").slice(0, 5000) };
    recordar();
    doc.current = { ...doc.current, textos: [...doc.current.textos, t] };
    setSeleccion(t.id);
    setHerramienta("seleccionar");
    cambio();
  };

  // Enlaces --------------------------------------------------------------------
  const guardarEnlace = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formEnlace) return;
    let url = formEnlace.url.trim();
    if (url && !/^https?:\/\//i.test(url)) url = `https://${url}`;
    if (!esEnlaceSeguro(url) || !sePuedeLeer(url)) {
      setAviso("Escribe una dirección web válida, por ejemplo https://www.utp.edu.co");
      return;
    }
    const t = formEnlace.t.trim().slice(0, 300) || new URL(url).hostname.replace(/^www\./, "");
    const s = 26;
    const w = anchoEnlace(t, s);
    setFormEnlace(null);
    setAviso("");
    if (formEnlace.id) {
      cambiarSeleccion((o) => (esTexto(o) ? null : { ...o, url, t, w: (w * Math.abs(o.h)) / (s * 1.6), h: o.h }));
      return;
    }
    const { x, y } = puntoVisible();
    agregarObjeto({ id: nuevoId(), tipo: "enlace", x, y, w, h: s * 1.6, c: fondo.oscuro ? "#4CC9F0" : "#2F6FE4", g: 1, url, t });
  };

  // Imágenes -------------------------------------------------------------------
  const subirImagen = async (archivo: Blob) => {
    setAviso("Subiendo imagen…");
    try {
      const { blob, ancho, alto } = await achicarImagen(archivo);
      const datos = new FormData();
      datos.append("imagen", blob);
      const respuesta = await fetch(`/api/apuntes/${apunte.id}/imagenes`, { method: "POST", body: datos, signal: conLimite(60000) });
      const r = await respuesta.json().catch(() => null);
      if (!respuesta.ok || !r?.ruta) throw new Error(r?.error || "No se pudo subir la imagen.");
      // Se muestra enseguida con la copia local mientras llega la de la nube.
      imagenDe(r.ruta, undefined, URL.createObjectURL(blob));
      const w = Math.min(600, ancho);
      const { x, y } = puntoVisible();
      agregarObjeto({ id: nuevoId(), tipo: "imagen", x, y, w, h: Math.round((w * alto) / ancho), c: color, g: 1, ruta: r.ruta });
      setAviso("");
    } catch (error) {
      setAviso(error instanceof Error && error.name !== "AbortError" ? error.message : "No se pudo subir la imagen. Revisa la conexión.");
    }
  };

  // Pegar lo copiado: imagen, enlace o texto.
  const pegar = (texto: string, imagen?: Blob | null) => {
    if (imagen) return void subirImagen(imagen);
    const limpio = texto.trim();
    if (!limpio) return;
    if (/^(https?:\/\/|www\.)\S+$/i.test(limpio)) {
      const url = /^https?:/i.test(limpio) ? limpio : `https://${limpio}`;
      if (esEnlaceSeguro(url) && sePuedeLeer(url)) {
        const t = new URL(url).hostname.replace(/^www\./, "");
        const { x, y } = puntoVisible();
        agregarObjeto({ id: nuevoId(), tipo: "enlace", x, y, w: anchoEnlace(t, 26), h: 26 * 1.6, c: fondo.oscuro ? "#4CC9F0" : "#2F6FE4", g: 1, url, t });
        return;
      }
    }
    agregarTextoPegado(limpio);
  };
  const pegarRef = useRef(pegar);
  pegarRef.current = pegar;

  useEffect(() => {
    const alPegar = (e: ClipboardEvent) => {
      if ((e.target as HTMLElement | null)?.closest?.("input, textarea, select")) return;
      const datos = e.clipboardData;
      if (!datos) return;
      const imagen = [...datos.items].find((i) => i.kind === "file" && i.type.startsWith("image/"))?.getAsFile();
      const texto = datos.getData("text/plain");
      if (!imagen && !texto) return;
      e.preventDefault();
      pegarRef.current(texto, imagen);
    };
    document.addEventListener("paste", alPegar);
    return () => document.removeEventListener("paste", alPegar);
  }, []);

  const pegarDelPortapapeles = async () => {
    try {
      if (navigator.clipboard?.read) {
        for (const item of await navigator.clipboard.read()) {
          const tipo = item.types.find((t) => t.startsWith("image/"));
          if (tipo) return pegar("", await item.getType(tipo));
          if (item.types.includes("text/plain")) return pegar(await (await item.getType("text/plain")).text());
        }
        return setAviso("No hay nada copiado para pegar.");
      }
      pegar(await navigator.clipboard.readText());
    } catch {
      setAviso("El navegador no dejó leer lo copiado. Toca la hoja y usa Ctrl+V (⌘+V en Mac), o Pegar del menú del teclado.");
    }
  };

  const alBajar = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.pointerType === "pen") lapizVisto.current = true;
    if (e.pointerType === "touch") {
      toques.current.set(e.pointerId, e.clientY);
      // Dos dedos (o el dedo cuando ya se usa lápiz) mueven la hoja.
      if (toques.current.size > 1 || lapizVisto.current) {
        trazo.current = null;
        pintarVista();
        return;
      }
    }
    if (e.button > 0) return;
    if (herramienta === "mover") {
      toques.current.set(e.pointerId, e.clientY);
      return;
    }
    if (herramienta === "texto") return; // se abre al soltar
    e.currentTarget.setPointerCapture(e.pointerId);
    const { x, y } = punto(e);
    if (herramienta === "seleccionar" || herramienta === "figura") {
      empezarArrastre(x, y);
      return;
    }
    if (herramienta === "borrador") {
      borrando.current = { antes: JSON.stringify(doc.current), cambio: false };
      borrarEn(x, y);
      return;
    }
    const h = herramienta === "resaltador" ? "resaltador" : "lapiz";
    trazo.current = { h, c: color, g: GROSORES[grosor][h], p: [] };
    agregarPunto(trazo.current.p, x, y, e.pointerType === "pen" ? e.pressure : 0.5);
    pintarVista();
  };

  const alMover = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const anterior = toques.current.get(e.pointerId);
    if (anterior !== undefined && (toques.current.size > 1 || lapizVisto.current || herramienta === "mover")) {
      window.scrollBy(0, (anterior - e.clientY) / Math.max(1, toques.current.size));
      toques.current.set(e.pointerId, e.clientY);
      return;
    }
    if (borrando.current) {
      const { x, y } = punto(e);
      borrarEn(x, y);
      return;
    }
    if (arrastre.current) {
      const { x, y } = punto(e);
      moverArrastre(x, y);
      return;
    }
    const t = trazo.current;
    if (!t) return;
    const eventos = e.nativeEvent.getCoalescedEvents?.() ?? [e.nativeEvent];
    let agregado = false;
    for (const ev of eventos.length ? eventos : [e.nativeEvent]) {
      const { x, y } = punto(ev);
      agregado = agregarPunto(t.p, x, y, e.pointerType === "pen" ? ev.pressure : 0.5) || agregado;
    }
    if (agregado) pintarVista();
  };

  const alSoltar = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const eraToque = toques.current.delete(e.pointerId);
    if (arrastre.current) {
      terminarArrastre();
      return;
    }
    if (borrando.current) {
      if (borrando.current.cambio) {
        recordar(borrando.current.antes);
        cambio();
      }
      borrando.current = null;
      return;
    }
    const t = trazo.current;
    if (t) {
      trazo.current = null;
      recordar();
      doc.current = { ...doc.current, trazos: [...doc.current.trazos, t] };
      cambio();
      return;
    }
    if (herramienta === "texto" && e.type === "pointerup" && !(eraToque && lapizVisto.current)) {
      const { x, y } = punto(e);
      abrirTexto(x, y);
    }
  };

  const cambiarFondo = (id: FondoId) => {
    const nuevo = fondoDe(id);
    if (color === colorInicial(fondo) && nuevo.oscuro !== fondo.oscuro) setColor(colorInicial(nuevo));
    setFondoId(id);
  };

  const masEspacio = () => {
    if (doc.current.alto >= ALTO_MAXIMO) return;
    recordar();
    doc.current = { ...doc.current, alto: Math.min(ALTO_MAXIMO, doc.current.alto + ALTO_EXTRA) };
    cambio();
  };

  const descargar = async () => {
    await cargarImagenes(doc.current);
    const c = document.createElement("canvas");
    const factor = 1.5;
    c.width = ANCHO * factor;
    c.height = doc.current.alto * factor;
    pintarTodo(c.getContext("2d")!, doc.current, fondo, factor);
    c.toBlob((blob) => {
      if (!blob) return;
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${(titulo.trim() || materia.nombre).replace(/[\\/:*?"<>|]/g, "")} ${fecha}.png`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    });
  };

  const seleccionado = buscar(doc.current, seleccion);
  const nombreSeleccion = (e: Objeto | Texto) =>
    esTexto(e) ? "Texto" : e.tipo === "imagen" ? "Imagen" : e.tipo === "enlace" ? "Enlace" : (FIGURAS.find((f) => f.id === e.tipo)?.nombre ?? "Figura");
  const editarTexto = (t: Texto) => {
    setSeleccion(null);
    setHerramienta("texto");
    flushSync(() => setEdicion({ id: t.id, x: t.x, y: t.y, c: t.c, s: t.s, valor: t.t }));
    areaTexto.current?.focus();
  };

  const estiloBoton = (activo: boolean) =>
    `flex size-10 shrink-0 items-center justify-center rounded-xl border ${activo ? "border-primario bg-primario text-sobre-primario" : "border-texto/20 bg-fondo text-texto"}`;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="size-4 shrink-0 rounded-full" style={{ backgroundColor: materia.color }} aria-hidden />
        <Link href={`/materias/${apunte.materia_id}`} className="text-sm underline">
          {materia.nombre}
        </Link>
        <span className="ml-auto text-sm" role="status" aria-live="polite">
          {ESTADOS[estado]}
        </span>
      </div>
      {estado === "error" && motivo && (
        <p role="alert" className="rounded-lg bg-alerta px-3 py-2 text-sm font-bold text-sobre-alerta">
          {motivo}
        </p>
      )}
      <div className="grid gap-3 sm:grid-cols-[1fr_11rem]">
        <label className="flex flex-col gap-1 text-sm font-medium">
          Tema de la clase
          <input
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            maxLength={120}
            placeholder="Apunte de clase"
            className="rounded-lg border border-texto/20 bg-fondo px-3 py-2 text-lg font-semibold outline-primario"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Fecha
          <input
            type="date"
            value={fecha}
            required
            onChange={(e) => e.target.value && setFecha(e.target.value)}
            className="rounded-lg border border-texto/20 bg-fondo px-3 py-2 text-base font-normal outline-primario"
          />
        </label>
      </div>

      <div
        role="toolbar"
        aria-label="Herramientas del pizarrón"
        className="sticky top-0 z-10 -mx-1 flex flex-col gap-2 rounded-2xl border border-texto/15 bg-superficie p-2 shadow-sm"
      >
        <div className="-mx-2 flex items-center gap-1.5 overflow-x-auto px-2 py-0.5 sm:flex-wrap">
          {HERRAMIENTAS.map((h) => (
            <button
              key={h.id}
              type="button"
              title={h.nombre}
              aria-label={h.nombre}
              aria-pressed={herramienta === h.id}
              onClick={() => {
                terminarTexto();
                setHerramienta(h.id);
                if (h.id !== "seleccionar") setSeleccion(null);
              }}
              className={estiloBoton(herramienta === h.id)}
            >
              <Icono trazo={h.trazo} />
            </button>
          ))}
          <span className="mx-1 h-8 w-px shrink-0 bg-texto/20" aria-hidden />
          {GROSORES.map((g, i) => (
            <button
              key={g.nombre}
              type="button"
              title={`Grosor ${g.nombre.toLowerCase()}`}
              aria-label={`Grosor ${g.nombre.toLowerCase()}`}
              aria-pressed={grosor === i}
              onClick={() => elegirGrosor(i)}
              className={estiloBoton(grosor === i)}
            >
              <span className="rounded-full bg-current" style={{ width: 4 + i * 5, height: 4 + i * 5 }} />
            </button>
          ))}
          <span className="mx-1 h-8 w-px shrink-0 bg-texto/20" aria-hidden />
          <button type="button" title="Deshacer" aria-label="Deshacer" disabled={!historial.atras} onClick={deshacer} className={`${estiloBoton(false)} disabled:opacity-40`}>
            <Icono trazo="M9 14 4 9l5-5M4 9h11a5 5 0 0 1 0 10h-3" />
          </button>
          <button type="button" title="Rehacer" aria-label="Rehacer" disabled={!historial.adelante} onClick={rehacer} className={`${estiloBoton(false)} disabled:opacity-40`}>
            <Icono trazo="m15 14 5-5-5-5M20 9H9a5 5 0 0 0 0 10h3" />
          </button>
          <span className="mx-1 h-8 w-px shrink-0 bg-texto/20" aria-hidden />
          <button type="button" title="Poner una imagen" aria-label="Poner una imagen" onClick={() => archivoImagen.current?.click()} className={estiloBoton(false)}>
            <Icono trazo="M4 5h16v14H4zM4 15l4-4 4 4 3-3 5 5M15.5 9.5h.01" />
          </button>
          <button
            type="button"
            title="Poner un enlace"
            aria-label="Poner un enlace"
            aria-expanded={!!formEnlace}
            onClick={() => setFormEnlace(formEnlace ? null : { url: "", t: "" })}
            className={estiloBoton(!!formEnlace)}
          >
            <Icono trazo="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" />
          </button>
          <button type="button" title="Pegar lo copiado" aria-label="Pegar lo copiado" onClick={pegarDelPortapapeles} className={estiloBoton(false)}>
            <Icono trazo="M9 3h6v4H9zM8 5H5v16h14V5h-3" />
          </button>
          <input
            ref={archivoImagen}
            type="file"
            accept="image/*"
            className="hidden"
            aria-hidden
            tabIndex={-1}
            onChange={(e) => {
              const archivo = e.target.files?.[0];
              e.target.value = "";
              if (archivo) subirImagen(archivo);
            }}
          />
        </div>
        {herramienta === "figura" && (
          <div role="radiogroup" aria-label="Figura" className="flex flex-wrap items-center gap-1.5">
            {FIGURAS.map((f) => (
              <button
                key={f.id}
                type="button"
                role="radio"
                aria-checked={figura === f.id}
                title={f.nombre}
                aria-label={f.nombre}
                onClick={() => setFigura(f.id)}
                className={estiloBoton(figura === f.id)}
              >
                <Icono trazo={f.trazo} />
              </button>
            ))}
            <span className="text-sm">Arrastra sobre la hoja para dibujarla, o tócala para ponerla.</span>
          </div>
        )}
        {seleccionado && (
          // Encima de la hoja, para que la hoja no salte al seleccionar.
          <div className="absolute inset-x-0 top-full mt-1 flex items-center gap-2 overflow-x-auto whitespace-nowrap rounded-2xl border border-texto/15 bg-superficie p-2 text-sm shadow-sm sm:flex-wrap">
            <span className="font-medium">{nombreSeleccion(seleccionado)}:</span>
            {esTexto(seleccionado) ? (
              <button type="button" onClick={() => editarTexto(seleccionado)} className="rounded-lg border border-texto/20 bg-fondo px-3 py-1.5">
                Editar texto
              </button>
            ) : (
              <>
                {(seleccionado.tipo === "rect" || seleccionado.tipo === "elipse") && (
                  <button
                    type="button"
                    aria-pressed={!!seleccionado.f}
                    onClick={() => cambiarSeleccion((o) => (esTexto(o) ? null : { ...o, f: o.f ? null : o.c }))}
                    className="rounded-lg border border-texto/20 bg-fondo px-3 py-1.5"
                  >
                    {seleccionado.f ? "Quitar relleno" : "Rellenar"}
                  </button>
                )}
                {seleccionado.tipo === "enlace" && seleccionado.url && (
                  <>
                    <a href={seleccionado.url} target="_blank" rel="noopener noreferrer" className="rounded-lg border border-texto/20 bg-fondo px-3 py-1.5 underline">
                      Abrir enlace
                    </a>
                    <button
                      type="button"
                      onClick={() => setFormEnlace({ url: seleccionado.url ?? "", t: seleccionado.t ?? "", id: seleccionado.id })}
                      className="rounded-lg border border-texto/20 bg-fondo px-3 py-1.5"
                    >
                      Cambiar enlace
                    </button>
                  </>
                )}
                <button type="button" onClick={alFrente} className="rounded-lg border border-texto/20 bg-fondo px-3 py-1.5">
                  Traer al frente
                </button>
              </>
            )}
            <button type="button" onClick={borrarSeleccion} className="rounded-lg border border-texto/20 bg-fondo px-3 py-1.5">
              Borrar
            </button>
          </div>
        )}
        {formEnlace && (
          <form onSubmit={guardarEnlace} className="flex flex-wrap items-end gap-2 text-sm">
            <label className="flex min-w-52 flex-1 flex-col gap-1 font-medium">
              Dirección web
              <input
                type="text"
                inputMode="url"
                autoCapitalize="none"
                autoCorrect="off"
                autoFocus
                required
                value={formEnlace.url}
                onChange={(e) => setFormEnlace({ ...formEnlace, url: e.target.value })}
                placeholder="https://www.utp.edu.co"
                className="rounded-lg border border-texto/20 bg-fondo px-3 py-2 text-base font-normal"
              />
            </label>
            <label className="flex min-w-40 flex-1 flex-col gap-1 font-medium">
              Texto que se ve (opcional)
              <input
                value={formEnlace.t}
                maxLength={300}
                onChange={(e) => setFormEnlace({ ...formEnlace, t: e.target.value })}
                className="rounded-lg border border-texto/20 bg-fondo px-3 py-2 text-base font-normal"
              />
            </label>
            <button type="submit" className="rounded-xl bg-primario px-4 py-2 font-medium text-sobre-primario">
              {formEnlace.id ? "Cambiar" : "Poner enlace"}
            </button>
            <button type="button" onClick={() => setFormEnlace(null)} className="rounded-xl border border-texto/20 bg-fondo px-4 py-2">
              Cancelar
            </button>
          </form>
        )}
        {aviso && (
          <p role="status" className="text-sm">
            {aviso}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-2">
          <div role="radiogroup" aria-label="Color" className="-mx-2 flex max-w-full gap-1.5 overflow-x-auto px-2 py-1 sm:flex-wrap">
            {COLORES.map((c) => (
              <button
                key={c.valor}
                type="button"
                role="radio"
                aria-checked={color === c.valor}
                aria-label={c.nombre}
                title={c.nombre}
                onClick={() => elegirColor(c.valor)}
                className={`size-8 shrink-0 rounded-full border-2 ${color === c.valor ? "border-primario ring-2 ring-primario ring-offset-2 ring-offset-superficie" : "border-texto/30"}`}
                style={{ backgroundColor: c.valor }}
              />
            ))}
          </div>
          <label className="flex items-center gap-2 text-sm font-medium sm:ml-auto">
            Fondo
            <select
              value={fondoId}
              onChange={(e) => cambiarFondo(e.target.value as FondoId)}
              className="rounded-lg border border-texto/20 bg-fondo px-2 py-2 text-base font-normal"
            >
              {FONDOS.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.nombre}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div ref={contenedor} className="relative w-full overflow-hidden rounded-xl border border-texto/15">
        <canvas
          ref={lienzo}
          aria-label="Hoja del pizarrón. Escribe con el dedo, el lápiz o el mouse; con la herramienta Texto, toca la hoja para escribir con el teclado."
          role="img"
          className="block w-full"
          style={{
            height: escala ? doc.current.alto * escala : undefined,
            aspectRatio: escala ? undefined : `${ANCHO} / ${doc.current.alto}`,
            touchAction: herramienta === "mover" ? "pan-y pinch-zoom" : "none",
            cursor: herramienta === "texto" ? "text" : herramienta === "mover" ? "grab" : herramienta === "seleccionar" ? "default" : "crosshair",
          }}
          onPointerDown={alBajar}
          onPointerMove={alMover}
          onPointerUp={alSoltar}
          onPointerCancel={alSoltar}
          onPointerLeave={(e) => e.pointerType === "mouse" && trazo.current && alSoltar(e)}
        />
        {edicion && (
          <textarea
            ref={areaTexto}
            value={edicion.valor}
            aria-label="Texto del apunte"
            onChange={(e) => setEdicion({ ...edicion, valor: e.target.value })}
            onBlur={terminarTexto}
            onKeyDown={(e) => e.key === "Escape" && (e.currentTarget as HTMLTextAreaElement).blur()}
            rows={Math.max(1, edicion.valor.split("\n").length)}
            spellCheck
            className="absolute resize-none overflow-hidden border border-dashed bg-transparent p-0 outline-none"
            style={{
              left: edicion.x * escala,
              top: edicion.y * escala,
              color: edicion.c,
              borderColor: edicion.c,
              fontFamily: LETRA,
              fontSize: edicion.s * escala,
              lineHeight: INTERLINEA,
              width: `min(${Math.max(6, ...edicion.valor.split("\n").map((l) => l.length + 2))}ch, ${(ANCHO - edicion.x) * escala}px)`,
            }}
          />
        )}
      </div>
      <p className="text-sm">
        En el celular o la tablet, muévete por la hoja con dos dedos. Si escribes con lápiz, el dedo solo mueve la hoja.
      </p>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={masEspacio}
          disabled={doc.current.alto >= ALTO_MAXIMO}
          className="rounded-xl border border-texto/20 bg-fondo px-4 py-2 text-sm font-medium disabled:opacity-60"
        >
          Más espacio abajo
        </button>
        <button type="button" onClick={descargar} className="rounded-xl border border-texto/20 bg-fondo px-4 py-2 text-sm font-medium">
          Descargar imagen
        </button>
        {estado !== "guardado" && (
          <button type="button" onClick={guardar} className="rounded-xl bg-primario px-4 py-2 text-sm font-medium text-sobre-primario">
            Guardar ahora
          </button>
        )}
      </div>
      {children}
    </div>
  );
}
