// Service worker offline FamVault (port strategi sw.js v12 vanilla).
// - Navigasi/HTML = network-first (fallback cache, terakhir '/').
// - Aset same-origin (termasuk chunk hash _next/) = cache-first + isi saat fetch.
// - Hanya respons 200 yang di-cache. Ganti VERSI tiap rilis shell.
const VERSI = 'famvault-v1';
const INTI = [
  '/',
  '/transaksi',
  '/riwayat',
  '/produk',
  '/hutang',
  '/pengaturan',
  '/manifest.webmanifest',
  '/ikon-192.png',
  '/ikon-512.png',
  '/favicon.ico'
];

self.addEventListener('install', function(e) {
  // Toleran: tiap file individual (addAll all-or-nothing bisa gagal total).
  e.waitUntil(
    caches.open(VERSI).then(function(cache) {
      return Promise.all(INTI.map(function(url) {
        return cache.add(url).catch(function() {});
      }));
    }).then(function() { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(kunci) {
      return Promise.all(kunci.filter(function(k) { return k !== VERSI; })
        .map(function(k) { return caches.delete(k); }));
    }).then(function() { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(e) {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== self.location.origin) return;
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request).then(function(res) {
        if (res.status === 200) {
          const salin = res.clone();
          caches.open(VERSI).then(function(cache) { cache.put(e.request, salin); });
        }
        return res;
      }).catch(function() {
        return caches.match(e.request).then(function(cocok) {
          if (cocok) return cocok;
          return caches.match('/');
        });
      })
    );
    return;
  }
  e.respondWith(
    caches.match(e.request).then(function(cocok) {
      if (cocok) return cocok;
      return fetch(e.request).then(function(res) {
        if (res.status === 200) {
          const salin = res.clone();
          caches.open(VERSI).then(function(cache) { cache.put(e.request, salin); });
        }
        return res;
      }).catch(function() {
        throw new Error('offline');
      });
    })
  );
});
