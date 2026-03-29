const STATIC_CACHE = 'robloxforge-static-v1'
const API_CACHE = 'robloxforge-api-v1'
const OFFLINE_URL = '/offline'

const STATIC_ASSETS = [
  '/',
  '/dashboard',
  '/offline',
  '/manifest.json',
  '/icons/icon-192.svg',
  '/icons/icon-512.svg',
]

// Background sync queue name
const SYNC_QUEUE_NAME = 'ai-generation-queue'

// ─── Install ────────────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[SW] Failed to cache some static assets:', err)
      })
    }).then(() => self.skipWaiting())
  )
})

// ─── Activate ───────────────────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== STATIC_CACHE && key !== API_CACHE)
          .map((key) => caches.delete(key))
      )
    )
  )
  self.clients.claim()
})

// ─── Fetch ───────────────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests
  if (request.method !== 'GET') return

  // Skip chrome-extension and non-http(s) requests
  if (!url.protocol.startsWith('http')) return

  // API routes — network first with cache fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirstStrategy(request))
    return
  }

  // Static assets — cache first
  if (isStaticAsset(url.pathname)) {
    event.respondWith(cacheFirstStrategy(request))
    return
  }

  // Navigation requests — network first, offline fallback
  if (request.mode === 'navigate') {
    event.respondWith(navigationStrategy(request))
    return
  }

  // Default: cache first
  event.respondWith(cacheFirstStrategy(request))
})

// ─── Background Sync ─────────────────────────────────────────────────────────
self.addEventListener('sync', (event) => {
  if (event.tag === SYNC_QUEUE_NAME) {
    event.waitUntil(processQueuedGenerations())
  }
})

// ─── Strategies ──────────────────────────────────────────────────────────────
async function cacheFirstStrategy(request) {
  const cached = await caches.match(request)
  if (cached) return cached

  try {
    const response = await fetch(request)
    if (response.ok) {
      const cache = await caches.open(STATIC_CACHE)
      cache.put(request, response.clone())
    }
    return response
  } catch {
    return new Response('Offline', { status: 503 })
  }
}

async function networkFirstStrategy(request) {
  try {
    const response = await fetch(request)
    if (response.ok) {
      const cache = await caches.open(API_CACHE)
      cache.put(request, response.clone())
    }
    return response
  } catch {
    const cached = await caches.match(request)
    if (cached) return cached
    return new Response(JSON.stringify({ error: 'offline', cached: false }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

async function navigationStrategy(request) {
  try {
    const response = await fetch(request)
    return response
  } catch {
    const cached = await caches.match(request)
    if (cached) return cached

    // Serve offline page
    const offlinePage = await caches.match(OFFLINE_URL)
    if (offlinePage) return offlinePage

    return new Response('<h1>You are offline</h1>', {
      headers: { 'Content-Type': 'text/html' },
    })
  }
}

function isStaticAsset(pathname) {
  return (
    pathname.startsWith('/_next/static/') ||
    pathname.startsWith('/fonts/') ||
    pathname.startsWith('/icons/') ||
    pathname.endsWith('.css') ||
    pathname.endsWith('.js') ||
    pathname.endsWith('.woff2') ||
    pathname.endsWith('.woff') ||
    pathname.endsWith('.svg') ||
    pathname.endsWith('.png') ||
    pathname.endsWith('.ico')
  )
}

// ─── Background sync processor ───────────────────────────────────────────────
async function processQueuedGenerations() {
  const db = await openQueueDB()
  const tx = db.transaction('queue', 'readwrite')
  const store = tx.objectStore('queue')
  const items = await getAllFromStore(store)

  for (const item of items) {
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item.payload),
      })
      if (response.ok) {
        store.delete(item.id)
        // Notify clients of successful sync
        const clients = await self.clients.matchAll()
        clients.forEach((client) =>
          client.postMessage({ type: 'SYNC_COMPLETE', id: item.id })
        )
      }
    } catch {
      // Will retry on next sync event
    }
  }
}

function openQueueDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('robloxforge-queue', 1)
    req.onupgradeneeded = (e) => {
      e.target.result.createObjectStore('queue', {
        keyPath: 'id',
        autoIncrement: true,
      })
    }
    req.onsuccess = (e) => resolve(e.target.result)
    req.onerror = reject
  })
}

function getAllFromStore(store) {
  return new Promise((resolve, reject) => {
    const req = store.getAll()
    req.onsuccess = (e) => resolve(e.target.result)
    req.onerror = reject
  })
}
