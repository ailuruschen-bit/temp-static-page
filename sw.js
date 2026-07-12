const CACHE = 'career-pocket-4e1aa5c4d5a3'
const ASSETS = [
  './', './index.html', './styles.css', './app.js', './content.js', './manifest.webmanifest', './icon.svg',
].map((asset) => new URL(asset, self.location).href)
const INDEX = new URL('./index.html', self.location).href

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting()))
})

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key.startsWith('career-pocket-') && key !== CACHE).map((key) => caches.delete(key)))).then(() => self.clients.claim()))
})

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return
  if (event.request.mode === 'navigate') {
    event.respondWith(caches.match(INDEX).then((cached) => cached || fetch(event.request)))
    return
  }
  event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request)))
})
