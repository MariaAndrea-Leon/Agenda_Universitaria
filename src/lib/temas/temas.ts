// Temas de color que el estudiante elige al configurar su agenda.
// Cada tema asigna los colores de la paleta a un rol de la interfaz;
// los componentes usan solo los roles (variables CSS), nunca el hex.

export type RolColor =
  | "fondo"
  | "fondo2"
  | "superficie"
  | "acento"
  | "sobreAcento"
  | "alerta"
  | "sobreAlerta"
  | "primario"
  | "sobrePrimario"
  | "texto"
  | "barra"
  | "sobreBarra";

export interface Tema {
  id: TemaId | typeof TEMA_OSCURO_ID;
  nombre: string;
  descripcion: string;
  colores: Record<RolColor, string>;
  // Degradado para encabezados y el panel "Hoy". Empieza por el color oscuro
  // porque el texto (sobreBarra) va a la izquierda.
  degradado: [string, string];
  // Dos colores que se difuminan sobre el fondo de la página, para que la
  // paleta se vea también fuera de las tarjetas.
  resplandor: [string, string];
}

// Temas del modo claro, entre los que elige el estudiante.
export type TemaId = "atardecer" | "tierra";

export const TEMAS: Record<TemaId, Tema> = {
  atardecer: {
    id: "atardecer",
    nombre: "Atardecer",
    descripcion: "Rojos y naranjas",
    colores: {
      fondo: "#F3F4F5",
      fondo2: "#E4EAEB",
      superficie: "#D8E0E1",
      acento: "#FF9408",
      sobreAcento: "#100C08",
      alerta: "#CA3F16",
      sobreAlerta: "#FFFFFF",
      primario: "#95122C",
      sobrePrimario: "#FFFFFF",
      texto: "#100C08",
      barra: "#95122C",
      sobreBarra: "#FFFFFF",
    },
    degradado: ["#95122C", "#FF9408"],
    resplandor: ["#FF9408", "#95122C"],
  },
  tierra: {
    id: "tierra",
    nombre: "Tierra",
    descripcion: "Ocres y verdes",
    colores: {
      fondo: "#F6F4F1",
      fondo2: "#EFE7D8",
      superficie: "#ECE2CE",
      acento: "#F2B635",
      sobreAcento: "#223300",
      // #E45C10 no llega a 4,5:1 con ningún texto: se usa como relleno con
      // texto grande o en negrita, y para íconos y bordes.
      alerta: "#E45C10",
      sobreAlerta: "#223300",
      primario: "#4B5D16",
      sobrePrimario: "#FFFFFF",
      texto: "#223300",
      barra: "#4B5D16",
      sobreBarra: "#FFFFFF",
    },
    degradado: ["#4B5D16", "#F2B635"],
    resplandor: ["#F2B635", "#4B5D16"],
  },
};

export const TEMA_POR_DEFECTO: TemaId = "atardecer";

export function esTemaId(valor: unknown): valor is TemaId {
  return typeof valor === "string" && valor in TEMAS;
}

// Modo oscuro: una sola paleta (verdes de Andrea), sin importar el tema
// claro elegido. La alerta es un coral añadido porque la paleta no trae un
// color cálido para avisos.
export const TEMA_OSCURO_ID = "bosque";

export const TEMA_OSCURO: Tema = {
  id: TEMA_OSCURO_ID,
  nombre: "Bosque",
  descripcion: "Verdes profundos",
  colores: {
    fondo: "#051F20",
    fondo2: "#0B2B26",
    superficie: "#163832",
    acento: "#8EB69B",
    sobreAcento: "#051F20",
    alerta: "#E07A5F",
    sobreAlerta: "#051F20",
    primario: "#8EB69B",
    sobrePrimario: "#051F20",
    texto: "#DAF1DE",
    barra: "#0B2B26",
    sobreBarra: "#DAF1DE",
  },
  degradado: ["#0B2B26", "#235347"],
  resplandor: ["#8EB69B", "#235347"],
};

export const TODOS_LOS_TEMAS: Tema[] = [...Object.values(TEMAS), TEMA_OSCURO];

// Claro, oscuro o lo que diga el dispositivo.
export type Modo = "claro" | "oscuro" | "sistema";

export const MODOS: { id: Modo; nombre: string }[] = [
  { id: "claro", nombre: "Claro" },
  { id: "oscuro", nombre: "Oscuro" },
  { id: "sistema", nombre: "Según el dispositivo" },
];

export const MODO_POR_DEFECTO: Modo = "sistema";

export function esModo(valor: unknown): valor is Modo {
  return valor === "claro" || valor === "oscuro" || valor === "sistema";
}

// Contraste WCAG 2.x entre dos colores hex (#RRGGBB).
export function contraste(a: string, b: string): number {
  const la = luminancia(a);
  const lb = luminancia(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

function luminancia(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
