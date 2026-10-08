import type { MetadataRoute } from "next";

// Manifiesto de la app instalable (PWA).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Agenda Universitaria",
    short_name: "Agenda",
    description: "Clases, tareas, exámenes y notas de la universidad en un solo lugar.",
    lang: "es",
    start_url: "/hoy",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#F3F4F5",
    theme_color: "#95122C",
    icons: [
      { src: "/iconos/icono-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/iconos/icono-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/iconos/icono-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Hoy", url: "/hoy" },
      { name: "Tareas", url: "/tareas" },
      { name: "Notas", url: "/notas" },
    ],
  };
}
