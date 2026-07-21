/*
 * sw.js — offline support for mysticscards.space
 * Network-first for same-origin; cache-first for Google Fonts.
 * PRECACHE lists every deployed file.
 */
// Cache-key bump on every deployed change. The five period-reading data
// files (dailycarddata, periodcarddata, yearcarddata, sevenyearcarddata,
// thirteenyearcarddata — ~500 KB total) are intentionally NOT in the
// precache list: js/in-time.js lazy-loads them on first Cycles-tab open.
// The fetch handler's write-through still caches them after that first
// fetch, so offline works once the user has opened Cycles once online.
const CACHE = 'mysticscards-44';
const PRECACHE = [
  './',
  'index.html',
  '404.html',
  'iching.html',
  'seedoracle.html',
  'manifest.webmanifest',
  'favicon.ico',
  'CNAME',
  'robots.txt',
  'sitemap.xml',
  'css/404.css',
  'css/mysticscards.css',
  'css/castfield.css',
  'css/iching.css',
  'css/seedoracle.css',
  'css/site.css',
  'js/store.js',
  'js/cardsdata.js',
  'js/reltext.js',
  'js/richmonddata.js',
  'js/spread-grid.js',
  'js/quadrations.js',
  'js/finder.js',
  'js/olney.js',
  'js/lifescript.js',
  'js/tzcoords.js',
  'js/solar-time.js',
  'js/sun-gate.js',
  'js/astronomy.js',
  'js/in-time.js',
  'js/birthdays.js',
  'js/finder-trays.js',
  'js/planetdata.js',
  'js/elementsdata.js',
  'js/elements.js',
  'js/castfield.js',
  'js/iching-store.js',
  'js/ichingdata.js',
  'js/linedata.js',
  'js/iching-hexagrams.js',
  'js/iching-cards.js',
  'js/iching-oracle.js',
  'js/iching-trigrams.js',
  'js/seedoracle.js',
  'js/seedoracle-geomancy.js',
  'js/seedoracle-bitcoin.js',
  'js/seedoracle-hexagrams.js',
  'js/seedoracle-store.js',
  'js/ichingjudgments.js',
  'js/bip39-words.js',
  'js/bip84.js',
  'js/site.js',
  'js/stars.js',
  'assets/favicon.svg',
  'assets/footer-fan.svg',
  'assets/apple-touch-icon.png',
  'assets/icon-192.png',
  'assets/icon-512.png',
  'assets/icon-512-maskable.png',
  'assets/og-image.png',
  'assets/card-back-square-mini.webp',
  'assets/cards/JC.webp',
  'assets/cards/JD.webp',
  'assets/cards/JH.webp',
  'assets/cards/JOKER.webp',
  'assets/cards/JS.webp',
  'assets/cards/KC.webp',
  'assets/cards/KD.webp',
  'assets/cards/KH.webp',
  'assets/cards/KS.webp',
  'assets/cards/QC.webp',
  'assets/cards/QD.webp',
  'assets/cards/QH.webp',
  'assets/cards/QS.webp'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  if (url.origin === location.origin) {
    const bypass = req.mode === 'navigate' || /\.(?:html|css|js)$/.test(url.pathname);
    e.respondWith(
      fetch(req, bypass ? { cache: 'reload' } : {})
        .then((res) => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(() =>
          caches.match(req, { ignoreSearch: true }).then((hit) => {
            if (hit) return hit;
            if (req.mode === 'navigate') return caches.match('index.html');
            return Response.error();
          })
        )
    );
  } else if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    e.respondWith(
      caches.match(req).then((hit) =>
        hit ||
        fetch(req).then((res) => {
          if (res && (res.ok || res.type === 'opaque')) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
          }
          return res;
        })
      )
    );
  }
});
