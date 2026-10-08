import { ANCHO, CUADRO, caminoSvg, INTERLINEA, LETRA, type Dibujo, type Fondo } from "@/lib/pizarron";

// Dibujo del pizarrón como SVG, para las miniaturas.
export function DibujoSvg({ dibujo, fondo, alto, className }: { dibujo: Dibujo; fondo: Fondo; alto: number; className?: string }) {
  const patron = `fondo-${fondo.id}`;
  return (
    <svg viewBox={`0 0 ${ANCHO} ${alto}`} preserveAspectRatio="xMidYMin slice" className={className} aria-hidden>
      {fondo.tipo !== "liso" && (
        <defs>
          <pattern id={patron} width={CUADRO} height={fondo.tipo === "rayas" ? CUADRO * 1.6 : CUADRO} patternUnits="userSpaceOnUse">
            <path
              d={fondo.tipo === "rayas" ? `M0 ${CUADRO * 1.6}H${CUADRO}` : `M${CUADRO} 0V${CUADRO}H0`}
              fill="none"
              stroke={fondo.linea}
              strokeWidth="1.5"
            />
          </pattern>
        </defs>
      )}
      <rect width={ANCHO} height={alto} fill={fondo.base} />
      {fondo.tipo !== "liso" && <rect width={ANCHO} height={alto} fill={`url(#${patron})`} />}
      {dibujo.trazos.map((t, i) => (
        <path
          key={i}
          d={caminoSvg(t.p)}
          fill="none"
          stroke={t.c}
          strokeWidth={t.g}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={t.h === "resaltador" ? 0.35 : 1}
        />
      ))}
      {dibujo.textos.map((t) => (
        <text key={t.id} x={t.x} y={t.y} fill={t.c} fontSize={t.s} fontFamily={LETRA}>
          {t.t.split("\n").map((linea, i) => (
            <tspan key={i} x={t.x} dy={i === 0 ? t.s * 0.95 : t.s * INTERLINEA}>
              {linea || " "}
            </tspan>
          ))}
        </text>
      ))}
    </svg>
  );
}
