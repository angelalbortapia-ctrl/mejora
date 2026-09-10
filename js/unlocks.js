import { getTotalLevel, getItem, setItem } from './core.js'

export const UNLOCKS = [
  { id: 'theme_ocean', level: 3, type: 'theme', name: 'Tema Océano', icon: '🌊', desc: 'Turquesa profundo' },
  { id: 'theme_sunset', level: 5, type: 'theme', name: 'Tema Atardecer', icon: '🌅', desc: 'Tonos cálidos' },
  { id: 'game_anagrams', level: 7, type: 'game', name: 'Anagramas', icon: '🔤', desc: 'Nuevo juego mental' },
  { id: 'review_monthly', level: 8, type: 'feature', name: 'Revisión Mensual', icon: '📅', desc: 'Reflexión de largo plazo' },
  { id: 'diff_expert', level: 10, type: 'feature', name: 'Modo Experto', icon: '💎', desc: 'Máxima dificultad' },
  { id: 'theme_midnight', level: 12, type: 'theme', name: 'Tema Medianoche', icon: '🌙', desc: 'Oscuro profundo' },
  { id: 'streak_shield', level: 15, type: 'feature', name: 'Escudo de racha', icon: '🛡️', desc: '1 día perdido al mes no rompe tu racha' },
  { id: 'theme_forest', level: 20, type: 'theme', name: 'Tema Cielo', icon: '☁️', desc: 'Neón etéreo' },
]

export const THEMES = {
  default: { name: 'Neón', icon: '💠' },
  theme_ocean: { name: 'Océano', icon: '🌊' },
  theme_sunset: { name: 'Atardecer', icon: '🌅' },
  theme_midnight: { name: 'Medianoche', icon: '🌙' },
  theme_forest: { name: 'Cielo', icon: '☁️' },
}

export function isUnlocked(unlockId) {
  const u = UNLOCKS.find(x => x.id === unlockId)
  if (!u) return true
  return getTotalLevel() >= u.level
}

export function getUnlocked() {
  return UNLOCKS.filter(u => isUnlocked(u.id))
}

export function getLocked() {
  return UNLOCKS.filter(u => !isUnlocked(u.id))
}

export function getNextUnlock() {
  const level = getTotalLevel()
  return UNLOCKS.find(u => u.level > level)
}

export function checkNewUnlocks(prevLevel, newLevel) {
  return UNLOCKS.filter(u => u.level > prevLevel && u.level <= newLevel)
}

export function getSeenUnlocks() {
  return getItem('seenUnlocks', [])
}

export function markUnlockSeen(id) {
  const seen = getSeenUnlocks()
  if (!seen.includes(id)) {
    seen.push(id)
    setItem('seenUnlocks', seen)
  }
}

export function applyTheme(themeId) {
  const id = themeId || 'default'
  if (id !== 'default' && !isUnlocked(id)) {
    document.documentElement.removeAttribute('data-theme')
    return 'default'
  }
  if (id === 'default') document.documentElement.removeAttribute('data-theme')
  else document.documentElement.setAttribute('data-theme', id.replace('theme_', ''))
  return id
}
