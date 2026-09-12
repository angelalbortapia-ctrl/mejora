/** Router + render con debounce para evitar ráfagas de DOM */

let renderImpl = null
let debounceId = null
let lastRenderPath = ''

const DEBOUNCE_MS = 48

export function bindRender(fn) {
  renderImpl = fn
}

export function getLastRenderPath() {
  return lastRenderPath
}

export function setLastRenderPath(path) {
  lastRenderPath = path
}

export function parsePath(hash = location.hash) {
  const full = hash.slice(1).split('?')[0] || '/'
  const parts = full.split('/').filter(Boolean)
  const path = '/' + (parts[0] || '')
  const sub = parts.slice(1)
  return { full, parts, path, sub }
}

export function buildHash(path, ...segments) {
  const base = path.replace(/^\//, '').replace(/\/$/, '')
  const rest = segments.filter(Boolean).map(s => String(s).replace(/\//g, ''))
  const segs = [base, ...rest].filter(Boolean)
  return '#/' + segs.join('/')
}

export function scheduleRender(immediate = false) {
  if (!renderImpl) return
  if (immediate) {
    clearTimeout(debounceId)
    debounceId = null
    renderImpl()
    return
  }
  if (debounceId) clearTimeout(debounceId)
  debounceId = setTimeout(() => {
    debounceId = null
    renderImpl()
  }, DEBOUNCE_MS)
}

export function navigate(path) {
  const target = path.startsWith('#') ? path.slice(1) : (path.startsWith('/') ? path : `/${path}`)
  const hash = `#${target}`
  if (location.hash !== hash) location.hash = hash
  else scheduleRender(true)
}
