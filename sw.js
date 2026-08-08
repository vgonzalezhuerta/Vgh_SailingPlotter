/* Plóter de regata — service worker
   APP:    precache del casco de la aplicación, network-first para la navegación
   TILES:  cache-first permanente, lo llena el botón «Descargar esta zona»
   CDN:    stale-while-revalidate                                            */

const VER = "v1";
const C_APP = `ploter-app-${VER}`;
const C_TILES = "ploter-tiles";        // sin versión: no se borra al actualizar
const C_CDN = `ploter-cdn-${VER}`;

const LOCALES = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
];

const CDN = [
  "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css",
  "https://cdnjs.cloudflare.com/ajax/libs/mqtt/5.3.5/mqtt.min.js",
  "https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;600;700&family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500&display=swap",
];

const esTile = (u) =>
  /tile\.openstreetmap\.org|basemaps\.cartocdn\.com|tiles\.openseamap\.org/.test(u.hostname);
const esCdn = (u) =>
  /cdnjs\.cloudflare\.com|fonts\.googleapis\.com|fonts\.gstatic\.com|unpkg\.com/.test(u.hostname);

self.addEventListener("install", (e) => {
  e.waitUntil((async () => {
    const app = await caches.open(C_APP);
    await app.addAll(LOCALES);                    // crítico: si falla, no instalamos
    const cdn = await caches.open(C_CDN);
    await Promise.all(CDN.map(async (u) => {      // opcional: tolerante a fallos
      try { await cdn.add(new Request(u, { mode: "cors", credentials: "omit" })); }
      catch (err) { /* se cacheará en cuanto se use */ }
    }));
    self.skipWaiting();
  })());
});

self.addEventListener("activate", (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map((k) => {
      if (k === C_TILES) return null;                       // las cartas se respetan
      if (k === C_APP || k === C_CDN) return null;
      return k.startsWith("ploter-") ? caches.delete(k) : null;
    }));
    await self.clients.claim();
  })());
});

self.addEventListener("message", (e) => {
  if (e.data === "skipWaiting") self.skipWaiting();
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  /* navegación: red primero, y si no hay, la copia guardada */
  if (req.mode === "navigate") {
    e.respondWith((async () => {
      try {
        const r = await fetch(req);
        const c = await caches.open(C_APP);
        c.put("./index.html", r.clone());
        return r;
      } catch (err) {
        return (await caches.match("./index.html")) || Response.error();
      }
    })());
    return;
  }

  /* mosaicos: caché primero y punto; sin red no se intenta nada */
  if (esTile(url)) {
    e.respondWith((async () => {
      const c = await caches.open(C_TILES);
      const hit = await c.match(req, { ignoreVary: true });
      if (hit) return hit;
      try {
        const r = await fetch(req);
        if (r.ok || r.type === "opaque") c.put(req, r.clone());
        return r;
      } catch (err) {
        return new Response("", { status: 504, statusText: "mosaico no descargado" });
      }
    })());
    return;
  }

  /* librerías y tipografías: sirve lo guardado y refresca por detrás */
  if (esCdn(url)) {
    e.respondWith((async () => {
      const c = await caches.open(C_CDN);
      const hit = await c.match(req, { ignoreVary: true });
      const red = fetch(req).then((r) => {
        if (r.ok || r.type === "opaque") c.put(req, r.clone());
        return r;
      }).catch(() => hit || Response.error());
      return hit || red;
    })());
    return;
  }

  /* resto del mismo origen */
  if (url.origin === location.origin) {
    e.respondWith((async () => {
      const hit = await caches.match(req);
      if (hit) return hit;
      try {
        const r = await fetch(req);
        const c = await caches.open(C_APP);
        if (r.ok) c.put(req, r.clone());
        return r;
      } catch (err) { return Response.error(); }
    })());
  }
});
