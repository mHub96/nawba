// Offline-first service worker: the crisis flow, its pictures and every narration clip must work with no signal.
// All paths are relative to this file, so the app works at a domain root or under a sub-path (GitHub Pages).
// The deploy replaces "nawba-dev" with the commit id, so every release changes this file and phones pick it up.
const VERSION = 'nawba-dev';
const R = (p) => new URL(p, self.location.href).href;
const SHELL = [
  './', 'index.html', 'app.css', 'app.js', 'manifest.webmanifest', 'icons/icon.svg', 'icons/icon-192.png', 'icons/apple-touch-icon.png',
  '../config.js', '../shared/icons.js', '../shared/theme.js', '../content/narration.json', '../img/guide.jpg', '../audio/index.json',
  '../fonts/fonts.css',
  '../fonts/reem-kufi-arabic-500-normal.woff2', '../fonts/reem-kufi-arabic-700-normal.woff2', '../fonts/reem-kufi-latin-700-normal.woff2',
  '../fonts/ibm-plex-sans-arabic-arabic-400-normal.woff2', '../fonts/ibm-plex-sans-arabic-arabic-500-normal.woff2', '../fonts/ibm-plex-sans-arabic-arabic-600-normal.woff2',
  '../fonts/ibm-plex-sans-arabic-latin-400-normal.woff2', '../fonts/ibm-plex-sans-arabic-latin-600-normal.woff2'
].map(R);
// step photos / animations used in the crisis flow (must work offline too)
const STEP_MEDIA = ['c_calm.jpg', 'c_space.jpg', 'c_clothes.jpg', 'c_donts.jpg', 'c_watch.jpg', 'n_calm.jpg', 'n_guide.jpg', 'n_talk.jpg',
  'rec1.jpg', 'rec2.jpg', 'rec3.jpg', 'rec4.jpg', 'breathe.jpg', 'no_food.jpg', 'rec2.webp', 'rec3.webp'].map(f => R(`../img/steps/${f}`));
const APP_ROOT = R('./');

self.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    const c = await caches.open(VERSION);
    // cache: 'reload' bypasses the browser's HTTP cache so an update never re-caches yesterday's files
    await c.addAll(SHELL.map(u => new Request(u, { cache: 'reload' })));
    try { await c.addAll(STEP_MEDIA.map(u => new Request(u, { cache: 'reload' }))); } catch (err) { /* fetched on demand later */ }
    try {
      const idx = await (await fetch(R('../audio/index.json'), { cache: 'no-cache' })).json();
      const urls = idx.files.map(f => R(`../audio/${f}.mp3?v=${idx.hashes[f]}`));
      for (let i = 0; i < urls.length; i += 12) await c.addAll(urls.slice(i, i + 12));
    } catch (err) { /* clips are fetched on demand later */ }
    self.skipWaiting();
  })());
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k !== VERSION) await caches.delete(k);
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  // the API lives on another origin (Cloudflare) and is never cached here
  if (e.request.method !== 'GET' || url.origin !== location.origin || url.pathname.includes('/api/')) return;
  if (url.pathname.includes('/audio/') && url.pathname.endsWith('.mp3')) {
    e.respondWith(caches.match(e.request).then(r => r || fetch(e.request).then(res => {
      if (res.ok) caches.open(VERSION).then(c => c.put(e.request, res.clone()));
      return res;
    })));
    return;
  }
  // app shell: answer from cache instantly, refresh in the background
  const inApp = url.href.startsWith(APP_ROOT);
  e.respondWith(caches.match(e.request, { ignoreSearch: inApp }).then(cached => {
    const net = fetch(e.request).then(res => {
      if (res.ok && res.type === 'basic') caches.open(VERSION).then(c => c.put(e.request, res.clone()));
      return res;
    }).catch(() => cached || caches.match(APP_ROOT));
    return cached || net;
  }));
});
