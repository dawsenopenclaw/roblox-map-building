// ForjeGames Service Worker v2
// Handles offline fallback, page caching, and PWA installability.

const CACHE_NAME = 'forjegames-v2'

// Core app shell to pre-cache on install
const PRECACHE_URLS = [
  '/',
  '/offline',
  '/editor',
  '/pricing',
  '/download',
  '/install',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)).catch(() => {
      // Pre-cache failures are non-fatal
    })
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return
  if (!event.request.url.startsWith(self.location.origin)) return

  const url = new URL(event.request.url)

  // API routes and Next.js internals — always network, never cache
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/_next/')) return

  // Static assets (icons, images, fonts) — cache-first
  if (/\.(svg|png|jpg|jpeg|webp|ico|woff2?|ttf|css|js)$/.test(url.pathname)) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached
        return fetch(event.request).then((response) => {
          if (response.ok) {
            const clone = response.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone))
          }
          return response
        }).catch(() => new Response('', { status: 503 }))
      })
    )
    return
  }

  // Navigation requests — network-first with cache fallback
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Cache successful navigations for offline use
          if (response.ok) {
            const clone = response.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone))
          }
          return response
        })
        .catch(() =>
          caches.match(event.request).then((cached) => {
            if (cached) return cached
            return caches.match('/offline')
          })
        )
    )
    return
  }

  // Everything else — network with cache fallback
  event.respondWith(
    fetch(event.request).catch(() =>
      caches.match(event.request).then((cached) => cached || new Response('Offline', { status: 503 }))
    )
  )
})
