import {
  ANCHO,
  cajaObjeto,
  CUADRO,
  caminoSvg,
  INTERLINEA,
  LETRA,
  letraEnlace,
  type Dibujo,
  type Fondo,
  type Objeto,
  puntasFlecha,
  URL_IMAGEN,
} from "@/lib/pizarron";

function ObjetoSvg({ o, enlaces }: { o: Objeto; enlaces: boolean }) {
  const c = cajaObjeto(o);
  const trazo = { stroke: o.c, strokeWidth: o.g, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  if (o.tipo === "rect")
    return <rect x={c.x} y={c.y} width={c.ancho} height={c.alto} fill={o.f ?? "none"} fillOpacity={o.f ? 0.25 : undefined} {...trazo} />;
  if (o.tipo === "elipse")
    return (
      <ellipse
        cx={c.x + c.ancho / 2}
        cy={c.y + c.alto / 2}
        rx={c.ancho / 2}
        ry={c.alto / 2}
        fill={o.f ?? "none"}
        fillOpacity={o.f ? 0.25 : undefined}
        {...trazo}
      />
    );
  if (o.tipo === "linea" || o.tipo === "flecha") {
    const p = puntasFlecha(o);
    return (
      <path
        d={`M${o.x} ${o.y}L${p.x2} ${p.y2}${o.tipo === "flecha" ? `M${p.a[0]} ${p.a[1]}L${p.x2} ${p.y2}L${p.b[0]} ${p.b[1]}` : ""}`}
        fill="none"
        {...trazo}
      />
    );
  }
  if (o.tipo === "imagen" && o.ruta)
    return <image href={URL_IMAGEN(o.ruta)} x={c.x} y={c.y} width={c.ancho} height={c.alto} preserveAspectRatio="none" />;
  if (o.tipo === "enlace" && o.url) {
    const s = letraEnlace(o);
    const chip = (
      <>
        <rect x={c.x} y={c.y} width={c.ancho} height={c.alto} rx={s * 0.4} fill={o.c} fillOpacity={0.12} />
        <text x={c.x + s * 0.4} y={c.y + c.alto / 2} dominantBaseline="middle" fill={o.c} fontSize={s} fontWeight={600} textDecoration="underline" fontFamily="system-ui, sans-serif">
          🔗 {o.t || o.url}
        </text>
      </>
    );
    return enlaces ? (
      <a href={o.url} target="_blank" rel="noopener noreferrer">
        {chip}
      </a>
    ) : (
      chip
    );
  }
  return null;
}

// Dibujo del pizarrón como SVG, para las miniaturas y la vista de lectura.
// Con enlaces=true los enlaces se pueden abrir (no dentro de otro enlace).
export function DibujoSvg({
  dibujo,
  fondo,
  alto,
  className,
  enlaces = false,
}: {
  dibujo: Dibujo;
  fondo: Fondo;
  alto: number;
  className?: string;
  enlaces?: boolean;
}) {
  const patron = `fondo-${fondo.id}`;
  return (
    <svg viewBox={`0 0 ${ANCHO} ${alto}`} preserveAspectRatio="xMidYMin slice" className={className} aria-hidden={!enlaces} aria-label={enlaces ? "Apunte" : undefined}>
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
      {dibujo.objetos.map((o) => (
        <ObjetoSvg key={o.id} o={o} enlaces={enlaces} />
      ))}
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
