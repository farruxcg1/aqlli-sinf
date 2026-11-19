// =====================================================================
//  Aqlli sinf — service worker (tezlik va internetsiz ishlash)
//  Birinchi ochilishdan keyin sayt (sahifalar, kod, shrift, rasm) keshda qoladi,
//  shundan so'ng internetsiz ham darrov ochiladi. Supabase ma'lumotlari (ballar)
//  esa hech qachon keshlanmaydi — ular doim serverdan olinadi.
//
//  Kod yangilanganda pastdagi VERSION raqamini oshiring — brauzer yangi versiyani
//  o'zi yuklab oladi va eski keshni tozalaydi.
// =====================================================================
const VERSION = "v1";
const CACHE = "aqlli-" + VERSION;

// Sayt "qobig'i" — o'rnatishda darrov keshlanadi (yo'q fayllar e'tiborsiz qoldiriladi)
const SHELL = [
  "./", "index.html",
  "kim-chiqadi.html", "qiziqarli-matematika.html", "baraban.html",
  "soz-ovchisi.html", "tabiat-sirlari.html", "qura.html", "taymer.html",
  "sinf-daftari.html", "reyting.html",
  "js/config.js", "js/store.js", "js/ui.js",
  "img/arqon-tortish.jpg",
];

// Shu hostlardan kelgan fayllar (shrift, kutubxona, model) keshlanadi
const CDN = ["fonts.googleapis.com", "fonts.gstatic.com", "cdn.jsdelivr.net", "storage.googleapis.com"];

self.addEventListener("install", (e) => {
  self.skipWaiting();
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    // Har bir faylni alohida — bittasi topilmasa ham qolganlari keshlanadi
    await Promise.all(SHELL.map((u) => c.add(u).catch(() => {})));
  })());
});

self.addEventListener("activate", (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

async function networkFirst(req) {
  const cache = await caches.open(CACHE);
  try {
    const res = await fetch(req);
    if (res && res.ok) cache.put(req, res.clone());
    return res;
  } catch (e) {
    const hit = await cache.match(req);
    if (hit) return hit;
    throw e;
  }
}

async function staleWhileRevalidate(req) {
  const cache = await caches.open(CACHE);
  const hit = await cache.match(req);
  const net = fetch(req).then((res) => {
    // opaque (cross-origin) javoblar ham keshlanadi — ko'rsatish uchun yetarli
    if (res && (res.ok || res.type === "opaque")) cache.put(req, res.clone());
    return res;
  }).catch(() => null);
  return hit || (await net) || fetch(req);
}

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  let url;
  try { url = new URL(req.url); } catch (_) { return; }
  if (url.protocol !== "http:" && url.protocol !== "https:") return;

  // Supabase (ballar, kirish, realtime) — hech qachon keshlanmaydi, doim tarmoqdan
  if (url.hostname.endsWith(".supabase.co")) return;

  const sameOrigin = url.origin === self.location.origin;

  if (sameOrigin) {
    // Sahifalar (HTML) — avval tarmoq, uzilsa keshdan (eng so'nggi versiya uchun)
    if (req.mode === "navigate" || url.pathname.endsWith(".html") || url.pathname === "/") {
      e.respondWith(networkFirst(req));
    } else {
      e.respondWith(staleWhileRevalidate(req));
    }
    return;
  }

  // Tashqi: faqat shrift / kutubxona / model keshlanadi, qolgani tegilmaydi
  if (CDN.includes(url.hostname)) {
    e.respondWith(staleWhileRevalidate(req));
  }
});
