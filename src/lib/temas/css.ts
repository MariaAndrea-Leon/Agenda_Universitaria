import { TEMAS, TEMA_POR_DEFECTO, type RolColor } from "./temas";

const VARIABLE: Record<RolColor, string> = {
  fondo: "--fondo",
  superficie: "--superficie",
  acento: "--acento",
  sobreAcento: "--sobre-acento",
  alerta: "--alerta",
  sobreAlerta: "--sobre-alerta",
  primario: "--primario",
  sobrePrimario: "--sobre-primario",
  texto: "--texto",
};

// Genera las variables CSS de todos los temas a partir de TEMAS, para que
// los colores vivan en un solo lugar.
export function cssDeTemas(): string {
  return Object.values(TEMAS)
    .map((tema) => {
      const selector =
        tema.id === TEMA_POR_DEFECTO
          ? `:root, [data-tema="${tema.id}"]`
          : `[data-tema="${tema.id}"]`;
      const vars = (Object.keys(VARIABLE) as RolColor[])
        .map((rol) => `${VARIABLE[rol]}: ${tema.colores[rol]};`)
        .concat(
          `--degradado-desde: ${tema.degradado[0]};`,
          `--degradado-hasta: ${tema.degradado[1]};`,
        )
        .join(" ");
      return `${selector} { ${vars} }`;
    })
    .join("\n");
}

// Cookie con el tema elegido. Se escribe al iniciar sesión y al cambiarlo en
// el perfil, y el layout la lee para pintar el tema correcto desde el
// servidor, sin parpadeo.
export const COOKIE_TEMA = "agenda-tema";
