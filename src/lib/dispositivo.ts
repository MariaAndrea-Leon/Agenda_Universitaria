// Nombre legible del equipo a partir del navegador ("Chrome en Android").
export function nombreDispositivo(ua: string, toques = 0): string {
  const navegador = /Edg\//.test(ua)
    ? "Edge"
    : /OPR\/|Opera/.test(ua)
      ? "Opera"
      : /SamsungBrowser/.test(ua)
        ? "Samsung Internet"
        : /Firefox\/|FxiOS/.test(ua)
          ? "Firefox"
          : /Chrome\/|CriOS/.test(ua)
            ? "Chrome"
            : /Safari\//.test(ua)
              ? "Safari"
              : "Navegador";
  const sistema = /iPad/.test(ua) || (/Macintosh/.test(ua) && toques > 1)
    ? "iPad"
    : /iPhone|iPod/.test(ua)
      ? "iPhone"
      : /Android/.test(ua)
        ? /Mobile/.test(ua)
          ? "celular Android"
          : "tablet Android"
        : /Windows/.test(ua)
          ? "Windows"
          : /CrOS/.test(ua)
            ? "Chromebook"
            : /Macintosh|Mac OS X/.test(ua)
              ? "Mac"
              : /Linux/.test(ua)
                ? "Linux"
                : "otro equipo";
  return `${navegador} en ${sistema}`;
}

// Dónde se puede abrir la app ya instalada, según el equipo.
export function comoAbrir(ua: string, toques = 0): string {
  const nombre = nombreDispositivo(ua, toques);
  if (/iPhone|iPad|Android/.test(nombre)) return "Ábrela desde el ícono Agenda de la pantalla de inicio.";
  if (/^(Chrome|Edge)/.test(nombre))
    return "Ábrela desde el ícono Agenda del escritorio o del menú de inicio, o con el botón «Abrir en la app» de la barra de direcciones.";
  return "Ábrela desde el ícono Agenda del escritorio o del menú de aplicaciones.";
}
