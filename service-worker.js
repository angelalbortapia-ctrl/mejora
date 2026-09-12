const BASE = new URL('.', self.location.href).pathname.replace(/\/$/, '')
const CACHE = 'mejora-v78'
const ASSETS = [
  `${BASE}/manifest.json`,
  `${BASE}/public/favicon.svg`,
  `${BASE}/public/icon-192.png`,
  `${BASE}/public/icon-512.png`,
  `${BASE}/public/apple-touch-icon.png`,
  `${BASE}/public/audio/rain.wav`,
  `${BASE}/public/audio/ocean.wav`,
  `${BASE}/public/audio/forest.wav`,
  `${BASE}/public/audio/wind.wav`,
  `${BASE}/public/audio/stream.wav`,
  `${BASE}/public/audio/fire.wav`,
  `${BASE}/public/audio/night.wav`,
  `${BASE}/public/audio/brown.wav`,
  `${BASE}/public/audio/cafe.wav`,
  `${BASE}/public/audio/zen.wav`,
]

const NETWORK_FIRST = [
  '/',
  '/index.html',
  '/css/utilities.css',
  '/css/design-system.css',
  '/css/forge.css',
  '/css/forge/01-tokens.css',
  '/css/forge/02-forge-vars.css',
  '/css/forge/03-shell.css',
  '/css/forge/04-legacy-pages.css',
  '/css/mejora-redesign.css',
  '/css/forge-pages.css',
  '/css/forge-meditation.css',
  '/css/forge-fx.css',
  '/css/onboarding.css',
  '/css/school.css',
  '/js/onboarding-ui.js',
  '/js/tour.js',
  '/js/version.js',
  '/js/meditations.js',
  '/js/meditation-service.js',
  '/js/pages/meditation.js',
  '/js/global-search.js',
  '/js/',
]

function relPath(url) {
  const p = url.pathname
  if (BASE && p.startsWith(BASE)) return p.slice(BASE.length) || '/'
  return p
}

function isNetworkFirst(url) {
  const rel = relPath(url)
  return NETWORK_FIRST.some(p => rel === p || rel.startsWith(p))
}

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  )
})

self.addEventListener('message', (e) => {
  if (e.data?.type === 'SKIP_WAITING') self.skipWaiting()
})

self.addEventListener('notificationclick', (e) => {
  e.notification.close()
  const url = e.notification.data?.url || `${BASE}/`
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
      for (const client of clients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url)
          return client.focus()
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(url)
    })
  )
})

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return
  const url = new URL(e.request.url)
  if (url.origin !== location.origin) return

  if (isNetworkFirst(url)) {
    e.respondWith(
      fetch(e.request).then(res => {
        if (res.ok) {
          const clone = res.clone()
          caches.open(CACHE).then(cache => cache.put(e.request, clone))
        }
        return res
      }).catch(() => caches.match(e.request))
    )
    return
  }

  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached
      return fetch(e.request).then(res => {
        if (res.ok) {
          const clone = res.clone()
          caches.open(CACHE).then(cache => cache.put(e.request, clone))
        }
        return res
      })
    })
  )
})
