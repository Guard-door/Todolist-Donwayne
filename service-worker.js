const APP_VERSION = '1.6.7';
const CACHE_NAME = 'todo-app-v' + APP_VERSION;
const ASSETS = [
  '.',
  'index.html',
  'css/style.css',
  'js/shell.js',
  'modules/todo/style.css',
  'modules/todo/app.js',
  'icon.svg',
  'manifest.json',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((cached) => cached || fetch(e.request))
  );
});
