import { TEMAS, TEMA_OSCURO, TEMA_POR_DEFECTO, type RolColor, type Tema } from "./temas";

const VARIABLE: Record<RolColor, string> = {
  fondo: "--fondo",
  fondo2: "--fondo-2",
  superficie: "--superficie",
  acento: "--acento",
  sobreAcento: "--sobre-acento",
  alerta: "--alerta",
  sobreAlerta: "--sobre-alerta",
  primario: "--primario",
  sobrePrimario: "--sobre-primario",
  texto: "--texto",
  barra: "--barra",
  sobreBarra: "--sobre-barra",
};

function variables(tema: Tema): string {
  return (Object.keys(VARIABLE) as RolColor[])
    .map((rol) => `${VARIABLE[rol]}: ${tema.colores[rol]};`)
    .concat(
      `--degradado-desde: ${tema.degradado[0]};`,
      `--degradado-hasta: ${tema.degradado[1]};`,
      `--resplandor-1: ${tema.resplandor[0]};`,
      `--resplandor-2: ${tema.resplandor[1]};`,
    )
    .join(" ");
}

// Genera las variables CSS de todos los temas a partir de temas.ts, para
// que los colores vivan en un solo lugar.
//
// En <html>: data-tema elige el tema claro y data-modo decide si se usa.
// Las reglas del modo oscuro van al final y con más especificidad
// (:root[...]) para ganarle al tema claro.
export function cssDeTemas(): string {
  const claros = Object.values(TEMAS).map((tema) => {
    const selector =
      tema.id === TEMA_POR_DEFECTO ? `:root, [data-tema="${tema.id}"]` : `[data-tema="${tema.id}"]`;
    return `${selector} { ${variables(tema)} color-scheme: light; }`;
  });
  const oscuro = `${variables(TEMA_OSCURO)} color-scheme: dark;`;

  return [
    ...claros,
    `:root[data-modo="oscuro"] { ${oscuro} }`,
    `@media (prefers-color-scheme: dark) { :root[data-modo="sistema"] { ${oscuro} } }`,
  ].join("\n");
}

// Cookies con el tema y el modo elegidos. Se escriben al iniciar sesión y
// al cambiarlos, y el layout las lee para pintar desde el servidor sin
// parpadeo.
export const COOKIE_TEMA = "agenda-tema";
export const COOKIE_MODO = "agenda-modo";
