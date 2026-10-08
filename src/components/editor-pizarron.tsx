"use client";

import Link from "next/link";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { crearClienteNavegador } from "@/lib/supabase/cliente";
import {
  agregarPunto,
  ALTO_EXTRA,
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
  INTERLINEA,
  LETRA,
  type Texto,
  tocaTrazo,
  type Trazo,
} from "@/lib/pizarron";

type Herramienta = "lapiz" | "resaltador" | "texto" | "borrador" | "mover";
type Estado = "guardado" | "pendiente" | "guardando" | "error";

const HERRAMIENTAS: { id: Herramienta; nombre: string; trazo: string }[] = [
  { id: "lapiz", nombre: "Lápiz", trazo: "M4 20l4-1L19 8l-3-3L5 16l-1 4zM14 7l3 3" },
  { id: "resaltador", nombre: "Resaltador", trazo: "M4 20h7M6 17l-2 3M9 14l-3 3 2 2 3-3M9 14l7-9 4 4-9 7M9 14l2 2" },
  { id: "texto", nombre: "Texto con teclado", trazo: "M5 7V5h14v2M12 5v14M9 19h6" },
  { id: "borrador", nombre: "Borrador", trazo: "M9 20h11M4.5 15.5l9-9 6 6-7.5 7.5H8z M10 10l6 6" },
  { id: "mover", nombre: "Mover la hoja", trazo: "M12 3v18M3 12h18M9 6l3-3 3 3M9 18l3 3 3-3M6 9l-3 3 3 3M18 9l3 3-3 3" },
];

const ESTADOS: Record<Estado, string> = {
  guardado: "Guardado",
  pendiente: "Cambios sin guardar",
  guardando: "Guardando…",
  error: "Sin conexión; reintentando",
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

export function pintarTodo(ctx: CanvasRenderingContext2D, d: Dibujo, fondo: Fondo, k: number, ocultar?: string) {
  pintarFondo(ctx, fondo, d.alto, k);
  for (const t of d.trazos) pintarTrazo(ctx, t, k);
  for (const t of d.textos) if (t.id !== ocultar) pintarTexto(ctx, t, k);
}

let medidor: CanvasRenderingContext2D | null = null;
function medirCon(s: number) {
  medidor ??= document.createElement("canvas").getContext("2d");
  return (linea: string) => {
    if (!medidor) return linea.length * s * 0.55;
    medidor.font = `${s}px ${LETRA}`;
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
    ctx.drawImage(b, 0, 0);
    if (trazo.current) pintarTrazo(ctx, trazo.current, escala * (window.devicePixelRatio || 1));
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
    pintarTodo(b.getContext("2d")!, doc.current, fondo, factor, edicion?.id);
    pintarVista();
  }, [escala, fondo, edicion?.id, pintarVista]);

  useEffect(() => {
    pintarBase();
  }, [pintarBase, version]);

  // La letra a mano puede tardar en cargar; se repinta cuando llega.
  useEffect(() => {
    document.fonts?.ready.then(() => pintarBase());
  }, [pintarBase]);

  // Guardado automático un momento después de cada cambio.
  const datosParaGuardar = useRef({ titulo, fecha, fondoId });
  datosParaGuardar.current = { titulo, fecha, fondoId };
  const guardar = useCallback(async () => {
    setEstado("guardando");
    const { titulo, fecha, fondoId } = datosParaGuardar.current;
    const { error } = await crearClienteNavegador()
      .from("apuntes")
      .update({
        titulo: titulo.trim() || null,
        fecha,
        fondo: fondoId,
        dibujo: doc.current,
        editado_en: new Date().toISOString(),
      })
      .eq("id", apunte.id);
    setEstado(error ? "error" : "guardado");
    return !error;
  }, [apunte.id]);

  useEffect(() => {
    if (primeraVez.current) {
      primeraVez.current = false;
      return;
    }
    setEstado("pendiente");
    let reintento: ReturnType<typeof setTimeout>;
    const intentar = async () => {
      if (!(await guardar())) reintento = setTimeout(intentar, 5000);
    };
    const espera = setTimeout(intentar, 1000);
    return () => {
      clearTimeout(espera);
      clearTimeout(reintento);
    };
  }, [version, titulo, fecha, fondoId, guardar]);

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

  useEffect(() => {
    const teclas = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey) || (e.target as HTMLElement).closest("input, textarea")) return;
      const z = e.key.toLowerCase() === "z";
      if (z && !e.shiftKey) deshacer();
      else if ((z && e.shiftKey) || e.key.toLowerCase() === "y") rehacer();
      else return;
      e.preventDefault();
    };
    window.addEventListener("keydown", teclas);
    return () => window.removeEventListener("keydown", teclas);
  }, [deshacer, rehacer]);

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

  const textoEn = (x: number, y: number) =>
    [...doc.current.textos].reverse().find((t) => dentroDe(cajaTexto(t, medirCon(t.s)), x, y, 6));

  const abrirTexto = (x: number, y: number) => {
    const existente = textoEn(x, y);
    const s = GROSORES[grosor].texto;
    const nueva: EdicionTexto = existente
      ? { id: existente.id, x: existente.x, y: existente.y, c: existente.c, s: existente.s, valor: existente.t }
      : { id: crypto.randomUUID().slice(0, 8), x: Math.round(x), y: Math.round(Math.max(0, y - s * 0.6)), c: color, s, valor: "" };
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
    if (trazos.length === d.trazos.length && textos.length === d.textos.length) return;
    doc.current = { ...d, trazos, textos };
    if (borrando.current) borrando.current.cambio = true;
    pintarBase();
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
    if (herramienta === "borrador") {
      borrando.current = { antes: JSON.stringify(doc.current), cambio: false };
      borrarEn(x, y);
      return;
    }
    const g = herramienta === "resaltador" ? GROSORES[grosor].resaltador : GROSORES[grosor].lapiz;
    trazo.current = { h: herramienta, c: color, g, p: [] };
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

  const descargar = () => {
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
              onClick={() => setGrosor(i)}
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
        </div>
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
                onClick={() => setColor(c.valor)}
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
            cursor: herramienta === "texto" ? "text" : herramienta === "mover" ? "grab" : "crosshair",
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
