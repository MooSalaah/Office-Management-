// Service Worker for Browser Notifications
const CACHE_NAME = 'engineering-office-v1'
const STATIC_CACHE_NAME = 'engineering-office-static-v1'
const DYNAMIC_CACHE_NAME = 'engineering-office-dynamic-v1'

// Files to cache
const STATIC_FILES = [
  '/',
  '/dashboard',
  '/projects',
  '/clients',
  '/tasks',
  '/finance',
  '/attendance',
  '/settings',
  '/logo.png',
  '/favicon.ico',
  '/Saudi_Riyal_Symbol.svg',
  '/Saudi_Riyal_Symbol_White.png',
  '/placeholder-logo.png',
  '/placeholder-logo.svg',
  '/placeholder-user.jpg',
  '/placeholder.jpg',
  '/placeholder.svg'
]

// Install event
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...')

  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('Caching static files')
        return cache.addAll(STATIC_FILES)
      })
      .then(() => {
        console.log('Service Worker installed')
        return self.skipWaiting()
      })
  )
})

// Activate event
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...')

  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE_NAME && cacheName !== DYNAMIC_CACHE_NAME) {
              console.log('Deleting old cache:', cacheName)
              return caches.delete(cacheName)
            }
          })
        )
      })
      .then(() => {
        console.log('Service Worker activated')
        return self.clients.claim()
      })
  )
})

// Helper functions
function isStaticFile(pathname) {
  const staticExtensions = ['.js', '.css', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.woff', '.woff2', '.ttf', '.eot']
  return staticExtensions.some(ext => pathname.endsWith(ext))
}

async function handleApiRequest(request) {
  // For now, just fetch from network. We can add caching strategies later if needed.
  // Skipping cache for local API to prevent stale data during development
  const url = new URL(request.url);
  if (url.port === '5000' || url.hostname === 'localhost') {
    return fetch(request);
  }

  try {
    return await fetch(request);
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Network error' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function handleStaticFile(request) {
  const cachedResponse = await caches.match(request)
  if (cachedResponse) {
    return cachedResponse
  }

  try {
    const response = await fetch(request)
    if (response.ok) {
      const cache = await caches.open(STATIC_CACHE_NAME)
      cache.put(request, response.clone())
    }
    return response
  } catch (error) {
    return new Response('Offline', { status: 503 })
  }
}

async function handleNavigation(request) {
  // Skip chrome-extension and other unsupported schemes
  if (request.url.startsWith('chrome-extension://') ||
    request.url.startsWith('moz-extension://') ||
    request.url.startsWith('safari-extension://')) {
    return fetch(request)
  }

  try {
    // Try network first for navigation
    const response = await fetch(request)

    if (response.ok) {
      // Cache successful navigation responses
      const cache = await caches.open(DYNAMIC_CACHE_NAME)
      cache.put(request, response.clone())
    }

    return response
  } catch (error) {
    // Fallback to cache if network fails
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      return cachedResponse
    }

    // Return offline page
    return caches.match('/')
  }
}

// Fetch event
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return
  }

  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request))
    return
  }

  // Handle static files
  if (isStaticFile(url.pathname)) {
    event.respondWith(handleStaticFile(request))
    return
  }

  // Handle navigation requests
  if (request.mode === 'navigate') {
    event.respondWith(handleNavigation(request))
    return
  }
})

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync())
  }
})

async function doBackgroundSync() {
  // Implementation for background sync
  console.log('Doing background sync')
}

// Push notification handling
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json()

    const options = {
      body: data.body || 'New notification',
      icon: '/logo.png',
      badge: '/logo.png',
      tag: data.tag || 'notification',
      requireInteraction: false,
      silent: false,
      actions: data.actions || [],
      data: data.data || {}
    }

    event.waitUntil(
      self.registration.showNotification(data.title || 'Engineering Office', options)
    )
  }
})

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  if (event.action) {
    console.log('Notification action clicked:', event.action)
  } else {
    event.waitUntil(
      clients.matchAll({ type: 'window' })
        .then((clientList) => {
          if (clientList.length > 0) {
            return clientList[0].focus()
          } else {
            return clients.openWindow('/')
          }
        })
    )
  }
})

// Message handling
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})

// Periodic background sync (if supported)
if ('periodicSync' in self.registration) {
  self.addEventListener('periodicsync', (event) => {
    if (event.tag === 'content-sync') {
      event.waitUntil(syncContent())
    }
  })
}

async function syncContent() {
  try {
    // Sync data with server
    const response = await fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    })

    if (response.ok) {
      const data = await response.json()
      console.log('Content synced successfully');
    }
  } catch (error) {
    console.error('Periodic sync failed:', error)
  }
}