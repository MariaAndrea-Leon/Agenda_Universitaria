import type { MetadataRoute } from "next";
import { headers } from "next/headers";

// Manifiesto de la app instalable (PWA).
export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost";
  const protocolo = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const extra = {
    // Abre la app instalada en la ventana que ya esté abierta.
    launch_handler: { client_mode: ["focus-existing", "auto"] },
    // Permite que el botón "Abrir la app" la abra en Chrome y Edge de computador.
    protocol_handlers: [{ protocol: "web+agenda", url: "/abrir?destino=%s" }],
  };
  return {
    id: "/hoy",
    name: "Agenda Universitaria",
    short_name: "Agenda",
    description: "Clases, tareas, exámenes y notas de la universidad en un solo lugar.",
    lang: "es",
    dir: "ltr",
    categories: ["education", "productivity"],
    start_url: "/hoy",
    scope: "/",
    display: "standalone",
    orientation: "any",
    background_color: "#F3F4F5",
    theme_color: "#95122C",
    icons: [
      { src: "/iconos/icono-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/iconos/icono-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/iconos/icono-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    // Las tiendas y el aviso de instalación muestran estas capturas.
    screenshots: [
      { src: "/capturas/hoy.webp", sizes: "540x1080", type: "image/webp", form_factor: "narrow", label: "Hoy: clases, entregas y exámenes" },
      { src: "/capturas/pizarron.webp", sizes: "540x1080", type: "image/webp", form_factor: "narrow", label: "Pizarrón de apuntes" },
      { src: "/capturas/notas.webp", sizes: "540x1080", type: "image/webp", form_factor: "narrow", label: "Notas y promedios" },
    ],
    shortcuts: [
      { name: "Hoy", url: "/hoy" },
      { name: "Tareas", url: "/tareas" },
      { name: "Notas", url: "/notas" },
    ],
    // Para que el navegador diga si ya está instalada en este equipo.
    related_applications: [{ platform: "webapp", url: `${protocolo}://${host}/manifest.webmanifest` }],
    ...extra,
  } as MetadataRoute.Manifest;
}
