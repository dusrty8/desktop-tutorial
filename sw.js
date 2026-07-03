/*
 * Annapurna — service worker.
 * Precache the app shell; serve cache-first with background refresh
 * (stale-while-revalidate) so the app works fully offline and still
 * picks up updates. Bump VERSION on every release.
 */
var VERSION = 'annapurna-v1';
var ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/style.css',
  './js/data/foods.js',
  './js/data/exercises.js',
  './js/nutrition.js',
  './js/store.js',
  './js/planner.js',
  './js/charts.js',
  './js/app.js',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png'
];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(VERSION).then(function (cache) { return cache.addAll(ASSETS); })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== VERSION; })
        .map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  var url = new URL(e.request.url);
  if (url.origin !== location.origin) return;
  e.respondWith(
    caches.open(VERSION).then(function (cache) {
      return cache.match(e.request).then(function (cached) {
        var refresh = fetch(e.request).then(function (resp) {
          if (resp && resp.ok) cache.put(e.request, resp.clone());
          return resp;
        }).catch(function () { return cached; });
        return cached || refresh;
      });
    })
  );
});
