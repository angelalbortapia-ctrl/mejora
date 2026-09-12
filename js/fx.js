/** Efectos visuales y hápticos — FORGE */

const FORGE_CONFETTI = ['#d4a012', '#f0b429', '#5c6b7a', '#eceff4', '#3d8f6a', '#c45c5c']

export function haptic(pattern = 12) {
  if (document.documentElement.classList.contains('reduce-motion')) return
  try { navigator.vibrate?.(pattern) } catch {}
}

export function celebrate(type = 'default') {
  haptic(type === 'level' ? [20, 40, 20, 40, 30] : [15, 30, 15])
  confetti(type === 'level' ? 55 : 32)
  if (type === 'level') flashPlanBanner()
}

function confetti(count = 32) {
  if (document.documentElement.classList.contains('reduce-motion')) return
  const container = document.getElementById('fx-layer')
  if (!container) return
  for (let i = 0; i < count; i++) {
    const el = document.createElement('span')
    el.className = 'fx-confetti'
    el.style.left = `${Math.random() * 100}%`
    el.style.background = FORGE_CONFETTI[i % FORGE_CONFETTI.length]
    el.style.animationDelay = `${Math.random() * 0.35}s`
    el.style.animationDuration = `${1.6 + Math.random() * 1.4}s`
    container.appendChild(el)
    setTimeout(() => el.remove(), 3500)
  }
}

/** Chispas bronce al completar hábito o acción */
export function forgeSparkAt(el, count = 10) {
  if (!el || document.documentElement.classList.contains('reduce-motion')) return
  const layer = document.getElementById('fx-layer')
  if (!layer) return
  const r = el.getBoundingClientRect()
  const cx = r.left + r.width / 2
  const cy = r.top + r.height / 2
  for (let i = 0; i < count; i++) {
    const s = document.createElement('span')
    s.className = 'fx-spark'
    const angle = (i / count) * Math.PI * 2 + Math.random() * 0.4
    const dist = 20 + Math.random() * 28
    s.style.left = `${cx}px`
    s.style.top = `${cy}px`
    s.style.setProperty('--fx-dx', `${Math.cos(angle) * dist}px`)
    s.style.setProperty('--fx-dy', `${Math.sin(angle) * dist}px`)
    layer.appendChild(s)
    setTimeout(() => s.remove(), 650)
  }
}

export function pulseElement(el) {
  if (!el || document.documentElement.classList.contains('reduce-motion')) return
  el.classList.remove('fx-pulse')
  void el.offsetWidth
  el.classList.add('fx-pulse')
}

export function flashPlanBanner() {
  if (document.documentElement.classList.contains('reduce-motion')) return
  const banner = document.getElementById('app-banner')
  if (!banner) return
  banner.classList.remove('banner-forge-flash')
  void banner.offsetWidth
  banner.classList.add('banner-forge-flash')
  setTimeout(() => banner.classList.remove('banner-forge-flash'), 1100)
}

export function isFocusMode(path, state = {}) {
  if (path === '/hoy') return true
  if (state.meditation) return true
  if (state.pomodoro) return true
  if (state.routine) return true
  if (state.brainExercise) return true
  return false
}

let lastShellKey = ''

export function updateAppShell(path, state = {}) {
  const page = (path.slice(1) || 'home').split('/')[0]
  const focus = isFocusMode(path, state)
  const enfoqueActive = !!(state.pomodoro && path === '/enfoque')
  const key = `${page}|${focus}|${enfoqueActive}`
  if (key === lastShellKey) return
  lastShellKey = key
  document.body.dataset.page = page
  document.body.classList.toggle('focus-mode', focus)
  document.body.classList.toggle('page-enfoque-active', enfoqueActive)
}
