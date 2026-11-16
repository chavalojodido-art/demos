/* Service worker genérico: precache de la app para uso offline (generado por _compartido/aplicar.py) */
const CACHE = "demo-los-coco-v3";
const ARCHIVOS = [
  "./",
  "./index.html",
  "./css/styles.css",
  "./css/extras.css",
  "./js/app.js",
  "./js/extras.js",
  "./config.json",
  "./manifest.json",
  "./assets/apple-touch-icon-180.png",
  "./assets/icon-192.png",
  "./assets/icon-512.png",
  "./assets/icon-maskable-512.png",
  "./assets/logo-los-coco.png",
  "./assets/ph-bebida.svg",
  "./assets/ph-desayuno.svg",
  "./assets/ph-pollo.svg",
  "./assets/ph-res.svg",
  "./assets/ph-sopa.svg"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(ARCHIVOS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;
  const red = () => fetch(req).then((res) => {
    if (res && res.status === 200) { const copia = res.clone(); caches.open(CACHE).then((c) => c.put(req, copia)); }
    return res;
  });
  // Navegación y config: primero red (datos frescos), si no hay conexión, caché (ignorando ?parámetros).
  if (req.mode === "navigate" || req.url.includes("config.json") || req.url.includes("manifest.json")) {
    event.respondWith(red().catch(() => caches.match(req, { ignoreSearch: true }).then((r) => r || caches.match("./index.html"))));
    return;
  }
  event.respondWith(caches.match(req).then((hit) => hit || red()));
});
