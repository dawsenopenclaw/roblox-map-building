// ForjeGames Service Worker
// Handles offline fallback and basic caching for the PWA.

const CACHE_NAME = 'forgegames-v1'

// Assets to pre-cache on install
const PRECACHE_URLS = [
  '/',
  '/offline',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)).catch(() => {
      // Pre-cache failures are non-fatal — skip if routes aren't available yet
    })
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  // Remove old caches
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  // Only handle GET requests for same-origin navigation
  if (event.request.method !== 'GET') return
  if (!event.request.url.startsWith(self.location.origin)) return

  // Skip API routes and Next.js internals — always go to network
  const url = new URL(event.request.url)
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/_next/')) return

  event.respondWith(
    fetch(event.request).catch(() =>
      caches.match(event.request).then((cached) => {
        if (cached) return cached
        // For navigation requests, return the offline page
        if (event.request.mode === 'navigate') {
          return caches.match('/offline')
        }
        return new Response('Offline', { status: 503 })
      })
    )
  )
})
