const BASE = new URL('.', self.location.href).pathname.replace(/\/$/, '')
const CACHE = 'mejora-v143'
const ASSETS = [
  `${BASE}/manifest.json`,
  `${BASE}/public/favicon.svg`,
  `${BASE}/public/icon-192.png`,
  `${BASE}/public/icon-512.png`,
  `${BASE}/public/apple-touch-icon.png`,
  `${BASE}/public/audio/rain.mp3`,
  `${BASE}/public/audio/ocean.mp3`,
  `${BASE}/public/audio/forest.mp3`,
  `${BASE}/public/audio/wind.mp3`,
  `${BASE}/public/audio/stream.mp3`,
  `${BASE}/public/audio/fire.mp3`,
  `${BASE}/public/audio/night.mp3`,
  `${BASE}/public/audio/cascada.mp3`,
  `${BASE}/public/audio/amanecer.mp3`,
  `${BASE}/public/audio/cafe.mp3`,
  `${BASE}/public/audio/lago.mp3`,
  `${BASE}/public/audio/tormenta.mp3`,
  `${BASE}/public/audio/jardin.mp3`,
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
  '/css/forge-lessons.css',
  '/js/onboarding-ui.js',
  '/js/tour.js',
  '/js/version.js',
  '/js/meditations.js',
  '/js/school-apply-lessons.js',
  '/js/meditation-service.js',
  '/js/meditation-voice.js',
  '/js/meditation-fx.js',
  '/js/ambient-audio.js',
  '/js/azure-tts.js',
  '/js/azure-usage.js',
  '/js/azure-config.js',
  '/js/gemini-tts.js',
  '/js/gemini-config.js',
  '/js/coach-engine.js',
  '/js/meditation-adaptive.js',
  '/js/pages/brain-gym.js',
  '/js/pages/meditation.js',
  '/js/global-search.js',
  '/js/fx.js',
  '/js/awards.js',
  '/js/app.js',
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
