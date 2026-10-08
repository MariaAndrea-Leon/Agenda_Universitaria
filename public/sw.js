// Service worker de Agenda Universitaria.
// - Guarda los archivos estáticos (_next/static, íconos) para abrir rápido.
// - Las páginas siempre se piden a la red, porque tienen datos privados; si
//   no hay conexión se muestra /offline.html.
const VERSION = "v1";
const ESTATICOS = `agenda-estaticos-${VERSION}`;
const PAGINA_SIN_RED = "/offline.html";

self.addEventListener("install", (evento) => {
  evento.waitUntil(
    caches
      .open(ESTATICOS)
      .then((cache) => cache.addAll([PAGINA_SIN_RED, "/iconos/icono-192.png"]))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (evento) => {
  evento.waitUntil(
    caches
      .keys()
      .then((claves) => Promise.all(claves.filter((c) => c !== ESTATICOS).map((c) => caches.delete(c))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (evento) => {
  const { request } = evento;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    evento.respondWith(fetch(request).catch(() => caches.match(PAGINA_SIN_RED)));
    return;
  }

  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/iconos/")) {
    evento.respondWith(
      caches.match(request).then(
        (guardada) =>
          guardada ||
          fetch(request).then((respuesta) => {
            if (respuesta.ok) {
              const copia = respuesta.clone();
              caches.open(ESTATICOS).then((cache) => cache.put(request, copia));
            }
            return respuesta;
          }),
      ),
    );
  }
});
