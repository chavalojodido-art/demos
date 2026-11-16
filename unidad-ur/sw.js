const CACHE = "unidad-ur-v2";
const PRECACHE = [
  "./",
  "index.html",
  "panel/index.html",
  "css/fonts.css",
  "css/styles.css",
  "css/extras.css",
  "js/extras.js",
  "js/citas.js",
  "js/app.js",
  "js/panel.js",
  "config.json",
  "manifest.json",
  "assets/fonts/inter-400.woff2",
  "assets/fonts/inter-600.woff2",
  "assets/icons/icon-192.png",
  "assets/photos/hero-720.webp",
  "assets/photos/doctor-namoyure.webp"
];
self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;
  e.respondWith(
    caches.match(req).then((cached) => {
      const fresh = fetch(req).then((res) => {
        if (res && res.status === 200 && res.type === "basic") {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      }).catch(() => cached);
      return cached || fresh;
    })
  );
});
