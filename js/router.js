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
  return { full, parts, path: '/' + (parts[0] || '') }
}

export function scheduleRender(immediate = false) {
  if (!renderImpl) return
  if (immediate) {
    clearTimeout(debounceId)
    debounceId = null
    renderImpl()
    return
  }
  if (debounceId) return
  debounceId = setTimeout(() => {
    debounceId = null
    renderImpl()
  }, DEBOUNCE_MS)
}

export function navigate(path) {
  const target = path.startsWith('/') ? path : `/${path}`
  if (location.hash !== `#${target}`) location.hash = target
  else scheduleRender(true)
}
