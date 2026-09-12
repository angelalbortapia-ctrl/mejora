/** Toasts, XP y premios del plan del día */

import { SKILLS, addXp, getTotalLevel } from './core.js'
import { checkNewUnlocks, markUnlockSeen } from './unlocks.js'
import { celebrate, pulseElement, flashPlanBanner } from './fx.js?v=82'
import { playTone } from './sounds.js'

function ensureToastContainer() {
  let el = document.getElementById('toast-container')
  if (!el) {
    el = document.createElement('div')
    el.id = 'toast-container'
    document.body.appendChild(el)
  }
  return el
}

export function showToast(message, xp, skill, levelUp = false) {
  const container = ensureToastContainer()
  const el = document.createElement('div')
  el.className = 'xp-toast' + (levelUp ? ' xp-toast-level' : '')
  const skillInfo = SKILLS[skill] || { icon: '⭐' }
  el.innerHTML = levelUp
    ? `<span class="toast-icon">🎉</span><div><strong>¡Nivel ${message}!</strong><p class="text-sm opacity-80">${skillInfo.name} · +${xp} XP</p></div>`
    : `<span class="toast-icon">${skillInfo.icon}</span><div><strong>+${xp} XP</strong><p class="text-sm opacity-80">${message}</p></div>`
  container.appendChild(el)
  playTone(levelUp ? 660 : 523, levelUp ? 0.25 : 0.15)
  setTimeout(() => { el.classList.add('toast-out'); setTimeout(() => el.remove(), 300) }, 2800)
}

export function showUnlockToast(unlock) {
  markUnlockSeen(unlock.id)
  const container = ensureToastContainer()
  const el = document.createElement('div')
  el.className = 'xp-toast unlock-toast'
  el.innerHTML = `<span class="toast-icon">${unlock.icon}</span><div><strong>¡Desbloqueado!</strong><p class="text-sm opacity-80">${unlock.name} · ${unlock.desc}</p></div>`
  container.appendChild(el)
  playTone(784, 0.3)
  setTimeout(() => { el.classList.add('toast-out'); setTimeout(() => el.remove(), 4000) }, 3500)
}

export function awardXp(skill, amount, message) {
  const prevLevel = getTotalLevel()
  const result = addXp(skill, amount)
  const newLevel = getTotalLevel()
  if (result.levelUp) {
    celebrate('level')
    showToast(result.newLevel, amount, skill, true)
  } else showToast(message, amount, skill)
  checkNewUnlocks(prevLevel, newLevel).forEach(showUnlockToast)
  return result
}

export function processPlanAwards(awards) {
  for (const a of awards) {
    if (a.bonus) {
      celebrate()
      flashPlanBanner()
      showToast('¡Plan del día completo!', a.result.xp, 'discipline')
    } else if (a.task) {
      showToast(a.task.label, a.result.xp, 'discipline')
      pulseElement(document.getElementById('banner-plan-bar'))
    }
  }
}
