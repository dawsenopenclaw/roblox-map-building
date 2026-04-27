// ForjeGames Service Worker v3
// Cache strategies, offline fallback, and web push notifications.

const STATIC_CACHE = 'forje-static-v1'
const API_CACHE = 'forje-api-v1'
const PAGES_CACHE = 'forje-pages-v1'
const MAX_CACHE_ENTRIES = 100

const PRECACHE_URLS = [
  '/',
  '/offline.html',
  '/editor',
  '/pricing',
  '/download',
]

async function trimCache(cacheName, maxItems) {
  const cache = await caches.open(cacheName)
  const keys = await cache.keys()
  if (keys.length > maxItems) {
    await Promise.all(keys.slice(0, keys.length - maxItems).map(k => cache.delete(k)))
  }
}

function isStaticAsset(url) {
  return (
    url.pathname.startsWith('/_next/static/') ||
    /\.(svg|png|jpg|jpeg|webp|gif|ico|woff2?|ttf|otf|css|js)$/.test(url.pathname)
  )
}

function isApiRoute(url) {
  return url.pathname.startsWith('/api/')
}

// Install
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(PAGES_CACHE)
      .then(cache => cache.addAll(PRECACHE_URLS))
      .catch(() => { /* Pre-cache failures are non-fatal */ })
  )
  self.skipWaiting()
})

// Activate
self.addEventListener('activate', (event) => {
  const validCaches = new Set([STATIC_CACHE, API_CACHE, PAGES_CACHE])
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => !validCaches.has(k)).map(k => caches.delete(k)))
    )
  )
  self.clients.claim()
})

// Fetch router
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return
  if (!event.request.url.startsWith(self.location.origin)) return

  const url = new URL(event.request.url)

  // 1) Static assets — cache-first
  if (isStaticAsset(url)) {
    event.respondWith(cacheFirst(event.request, STATIC_CACHE))
    return
  }

  // 2) API routes — network-first with cache fallback
  if (isApiRoute(url)) {
    event.respondWith(networkFirst(event.request, API_CACHE))
    return
  }

  // 3) Navigation / pages — stale-while-revalidate
  if (event.request.mode === 'navigate') {
    event.respondWith(staleWhileRevalidate(event.request, PAGES_CACHE))
    return
  }

  // 4) Everything else — network with cache fallback
  event.respondWith(
    fetch(event.request).catch(() =>
      caches.match(event.request).then(c => c || new Response('Offline', { status: 503 }))
    )
  )
})

// Cache strategies
async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request)
  if (cached) return cached

  try {
    const response = await fetch(request)
    if (response.ok) {
      const cache = await caches.open(cacheName)
      cache.put(request, response.clone())
      trimCache(cacheName, MAX_CACHE_ENTRIES)
    }
    return response
  } catch {
    return new Response('', { status: 503, statusText: 'Offline' })
  }
}

async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request)
    if (response.ok) {
      const cache = await caches.open(cacheName)
      cache.put(request, response.clone())
      trimCache(cacheName, MAX_CACHE_ENTRIES)
    }
    return response
  } catch {
    const cached = await caches.match(request)
    return cached || new Response(JSON.stringify({ error: 'offline' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName)
  const cached = await cache.match(request)

  const fetchPromise = fetch(request)
    .then(response => {
      if (response.ok) {
        cache.put(request, response.clone())
        trimCache(cacheName, MAX_CACHE_ENTRIES)
      }
      return response
    })
    .catch(() => null)

  if (cached) {
    // Serve stale, revalidate in background
    fetchPromise // fire and forget
    return cached
  }

  // Nothing cached — wait for network
  const response = await fetchPromise
  if (response) return response

  // Network failed, no cache — show offline page
  const offlinePage = await caches.match('/offline.html')
  return offlinePage || new Response('Offline', { status: 503 })
}

// Push notifications
self.addEventListener('push', (event) => {
  if (!event.data) return

  let data
  try {
    data = event.data.json()
  } catch {
    data = { title: 'ForjeGames', body: event.data.text() }
  }

  const title = data.title || 'ForjeGames'
  const options = {
    body: data.body || '',
    icon: data.icon || '/logo.png',
    badge: data.badge || '/logo.png',
    data: { url: data.data?.url || data.url || '/dashboard' },
    vibrate: [100, 50, 100],
    tag: data.tag || 'forje-notification',
    renotify: true,
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const targetUrl = event.notification.data?.url || '/dashboard'

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
      // Focus existing tab if found
      for (const client of clients) {
        if (client.url.includes(targetUrl) && 'focus' in client) {
          return client.focus()
        }
      }
      // Open new tab
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl)
      }
    })
  )
})
