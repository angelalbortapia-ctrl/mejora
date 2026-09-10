const CACHE = 'mejora-v21'
const ASSETS = [
  '/',
  '/index.html',
  '/styles.css',
  '/css/utilities.css',
  '/js/app.js',
  '/js/core.js',
  '/js/content.js',
  '/js/unlocks.js',
  '/js/apis.js',
  '/js/notifications.js',
  '/js/brain-program.js',
  '/js/brain-exercises.js',
  '/js/layout.js',
  '/js/journey.js',
  '/js/analytics.js',
  '/js/ui.js',
  '/js/tour.js',
  '/js/backup.js',
  '/manifest.json',
  '/public/favicon.svg',
]

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

self.addEventListener('notificationclick', (e) => {
  e.notification.close()
  const url = e.notification.data?.url || '/'
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

  e.respondWith(
    caches.match(e.request).then(cached => {
      const fetchPromise = fetch(e.request).then(res => {
        if (res.ok) {
          const clone = res.clone()
          caches.open(CACHE).then(cache => cache.put(e.request, clone))
        }
        return res
      }).catch(() => cached)
      return cached || fetchPromise
    })
  )
})
