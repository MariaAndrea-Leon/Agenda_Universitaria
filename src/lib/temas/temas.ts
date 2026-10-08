// Temas de color que el estudiante elige al configurar su agenda.
// Cada tema asigna los colores de la paleta a un rol de la interfaz;
// los componentes usan solo los roles (variables CSS), nunca el hex.

export type RolColor =
  | "fondo"
  | "superficie"
  | "acento"
  | "sobreAcento"
  | "alerta"
  | "sobreAlerta"
  | "primario"
  | "sobrePrimario"
  | "texto";

export interface Tema {
  id: TemaId;
  nombre: string;
  descripcion: string;
  colores: Record<RolColor, string>;
  // Degradado para encabezados y el panel "Hoy". Empieza por el color oscuro
  // porque el texto blanco va a la izquierda.
  degradado: [string, string];
}

export type TemaId = "atardecer" | "tierra";

export const TEMAS: Record<TemaId, Tema> = {
  atardecer: {
    id: "atardecer",
    nombre: "Atardecer",
    descripcion: "Rojos y naranjas",
    colores: {
      fondo: "#F3F4F5",
      superficie: "#D8E0E1",
      acento: "#FF9408",
      sobreAcento: "#100C08",
      alerta: "#CA3F16",
      sobreAlerta: "#FFFFFF",
      primario: "#95122C",
      sobrePrimario: "#FFFFFF",
      texto: "#100C08",
    },
    degradado: ["#95122C", "#FF9408"],
  },
  tierra: {
    id: "tierra",
    nombre: "Tierra",
    descripcion: "Ocres y verdes",
    colores: {
      fondo: "#F6F4F1",
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
    },
    degradado: ["#4B5D16", "#F2B635"],
  },
};

export const TEMA_POR_DEFECTO: TemaId = "atardecer";

export function esTemaId(valor: unknown): valor is TemaId {
  return typeof valor === "string" && valor in TEMAS;
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
