/** Efectos visuales y hápticos */

export function haptic(pattern = 12) {
  try { navigator.vibrate?.(pattern) } catch {}
}

export function celebrate(type = 'default') {
  haptic(type === 'level' ? [20, 40, 20, 40, 30] : [15, 30, 15])
  confetti(type === 'level' ? 50 : 28)
}

function confetti(count = 50) {
  const container = document.getElementById('fx-layer')
  if (!container) return
  const colors = ['#2dd4bf', '#818cf8', '#f472b6', '#fbbf24', '#34d399']
  for (let i = 0; i < count; i++) {
    const el = document.createElement('span')
    el.className = 'fx-confetti'
    el.style.left = `${Math.random() * 100}%`
    el.style.background = colors[i % colors.length]
    el.style.animationDelay = `${Math.random() * 0.4}s`
    el.style.animationDuration = `${1.8 + Math.random() * 1.2}s`
    container.appendChild(el)
    setTimeout(() => el.remove(), 3500)
  }
}

export function pulseElement(el) {
  if (!el) return
  el.classList.remove('fx-pulse')
  void el.offsetWidth
  el.classList.add('fx-pulse')
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
