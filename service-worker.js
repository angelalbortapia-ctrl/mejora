const BASE = new URL('.', self.location.href).pathname.replace(/\/$/, '')
const ASSET_V = 179
const CACHE = `mejora-v${ASSET_V}`

const ICONS = [
  '/manifest.json',
  '/public/favicon.svg',
  '/public/icon-192.png',
  '/public/icon-512.png',
  '/public/apple-touch-icon.png',
]

const AMBIENT_AUDIO = [
  '/public/audio/rain.mp3',
  '/public/audio/ocean.mp3',
  '/public/audio/forest.mp3',
  '/public/audio/wind.mp3',
  '/public/audio/stream.mp3',
  '/public/audio/fire.mp3',
  '/public/audio/night.mp3',
  '/public/audio/cascada.mp3',
  '/public/audio/amanecer.mp3',
  '/public/audio/cafe.mp3',
  '/public/audio/lago.mp3',
  '/public/audio/tormenta.mp3',
  '/public/audio/jardin.mp3',
]

const SHELL_CSS = [
  '/css/utilities.css',
  '/css/design-system.css',
  '/css/forge.css',
  '/css/forge/01-tokens.css',
  '/css/forge/02-forge-vars.css',
  '/css/forge/03-shell.css',
  '/css/forge/04-legacy-pages.css',
  '/css/mejora-redesign.css',
  '/css/brain-wellness.css',
  '/css/rpg-theme.css',
  '/css/rpg-type.css',
  '/css/rpg-fx.css',
  '/css/forge-pages.css',
  '/css/forge-meditation.css',
  '/css/forge-fx.css',
  '/css/onboarding.css',
  '/css/school.css',
  '/css/forge-lessons.css',
]

const SHELL_HTML = ['/', '/index.html', '/privacy.html']

function abs(path) {
  if (!path.startsWith('/')) path = `/${path}`
  return `${BASE}${path}`
}

function relPath(url) {
  const p = url.pathname
  if (BASE && p.startsWith(BASE)) return p.slice(BASE.length) || '/'
  return p
}

function isShellAsset(url) {
  const rel = relPath(url)
  if (SHELL_HTML.includes(rel)) return true
  if (SHELL_CSS.some(p => rel === p || rel.startsWith(p + '?'))) return true
  if (rel === '/js/import-map.json' || rel.startsWith('/js/import-map.json?')) return true
  if (rel.startsWith('/js/') && rel.endsWith('.js')) return true
  return false
}

async function collectShellUrls() {
  const urls = new Set()
  SHELL_HTML.forEach(p => urls.add(abs(p)))
  SHELL_CSS.forEach(p => urls.add(abs(`${p}?v=${ASSET_V}`)))
  ICONS.forEach(p => urls.add(abs(p)))

  try {
    const mapUrl = abs(`/js/import-map.json?v=${ASSET_V}`)
    const res = await fetch(mapUrl)
    if (res.ok) {
      const map = await res.json()
      Object.values(map.imports || {}).forEach(spec => {
        const path = String(spec).split('?')[0]
        urls.add(abs(path.startsWith('/') ? `${path}?v=${ASSET_V}` : `/js/${path}?v=${ASSET_V}`))
      })
      urls.add(mapUrl)
    }
  } catch {
    urls.add(abs(`/js/app.js?v=${ASSET_V}`))
    urls.add(abs(`/js/core.js?v=${ASSET_V}`))
    urls.add(abs(`/js/router.js?v=${ASSET_V}`))
  }

  return [...urls]
}

async function precacheShell(cache) {
  const urls = await collectShellUrls()
  await Promise.allSettled(urls.map(async (url) => {
    try {
      const res = await fetch(url, { cache: 'no-cache' })
      if (res.ok) await cache.put(url, res)
    } catch {
      /* red ausente en install — se rellena en la primera visita */
    }
  }))
}

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then(cache => precacheShell(cache))
      .then(() => cache.addAll(AMBIENT_AUDIO.map(abs)))
      .then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim()).then(() =>
      self.clients.matchAll({ type: 'window' }).then(clients => {
        clients.forEach(c => c.postMessage({ type: 'APP_UPDATED', version: ASSET_V }))
      })
    )
  )
})

self.addEventListener('message', (e) => {
  if (e.data?.type === 'SKIP_WAITING') self.skipWaiting()
})

self.addEventListener('notificationclick', (e) => {
  e.notification.close()
  const url = e.notification.data?.url || abs('/')
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

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE)
  const cached = await cache.match(request)
  const network = fetch(request).then(res => {
    if (res.ok) cache.put(request, res.clone())
    return res
  }).catch(() => null)
  if (cached) {
    network.catch(() => {})
    return cached
  }
  const res = await network
  if (res) return res
  return caches.match(abs('/index.html'))
}

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return
  const url = new URL(e.request.url)
  if (url.origin !== location.origin) return

  const rel = relPath(url)
  if (rel === '/js/version.js' || rel.startsWith('/js/version.js?')) {
    e.respondWith(
      fetch(e.request, { cache: 'no-store' }).catch(() => caches.match(e.request))
    )
    return
  }

  if (isShellAsset(url) || SHELL_HTML.includes(rel)) {
    e.respondWith(staleWhileRevalidate(e.request))
    return
  }

  if (AMBIENT_AUDIO.some(p => relPath(url) === p)) {
    e.respondWith(
      caches.match(e.request).then(cached => cached || fetch(e.request))
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
