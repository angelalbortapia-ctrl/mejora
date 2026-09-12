/** Perfil — resumen, logros, desbloqueables */

import {
  getProgress, getTotalLevel, getRank, getStats, getAchievements, getStreakShieldStatus,
} from '../core.js'
import { UNLOCKS, isUnlocked, getNextUnlock } from '../unlocks.js'
import { tabBar, pageHero } from '../ui.js'
import { skillBars } from '../page-helpers.js'

let profileTab = 'resumen'

export function getProfileTab() { return profileTab }
export function setProfileTab(v) { profileTab = v }

export function renderProfile() {
  const achievements = getAchievements()
  const unlocked = achievements.filter(a => a.unlocked).length
  const stats = getStats()
  const p = getProgress()
  const rank = getRank()

  const profileTabs = tabBar([
    { id: 'resumen', label: 'Resumen', icon: '👤' },
    { id: 'logros', label: `Logros (${unlocked})`, icon: '🏅' },
    { id: 'desbloqueables', label: 'Extras', icon: '🔓' },
  ], profileTab, 'profileTab')

  const shieldBlock = (() => {
    const sh = getStreakShieldStatus()
    if (!sh.unlocked) return ''
    return `<div class="card p-4 flex items-center gap-3 profile-shield-wrap ${sh.available ? '' : 'opacity-70'}">
      <span class="text-3xl">🛡️</span>
      <div class="flex-1">
        <p class="font-medium text-main">Escudo de racha</p>
        <p class="text-xs text-muted">${sh.available ? '1 día perdido al mes no rompe tu racha · Disponible' : `Usado este mes${sh.savedDate ? ` (${sh.savedDate})` : ''}`}</p>
      </div>
    </div>`
  })()

  const resumenBlock = `
    <div class="profile-dashboard page-dashboard">
      <div class="card profile-skills">${skillBars()}</div>
      ${shieldBlock}
      <div class="ds-stat-row profile-stats span-full">
        ${[
          ['Rutinas', stats.routinesCompleted], ['Ejercicios', stats.brainSessions],
          ['Meditación', stats.meditationMinutes + ' min'],
          ['Hábitos', stats.habitsCompleted], ['Desafíos', stats.challengesWon],
        ].map(([l, v]) => `<div class="ds-stat"><p class="ds-stat-value">${v}</p><p class="ds-stat-label">${l}</p></div>`).join('')}
      </div>
      <h2 class="ds-section-title span-full">Récords</h2>
      <div class="card span-full">
        ${Object.keys(p.records).length === 0 ? '<p class="text-muted text-sm">Entrena en el laboratorio para establecer récords.</p>' :
          Object.entries(p.records).map(([k, r]) => `<div class="flex justify-between py-2 border-b border-[var(--border)] last:border-0">
            <span class="text-sm text-main">${k.replace('_', ' · ')}</span>
            <span class="text-sm font-medium text-muted">${r.best} pts · ${r.plays} partidas</span>
          </div>`).join('')}
      </div>
    </div>`

  const logrosBlock = `
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 profile-ach-grid">
      ${achievements.map(a => `<div class="card text-center py-4 ${a.unlocked ? '' : 'opacity-40'}">
        <span class="text-3xl">${a.icon}</span>
        <p class="text-sm font-medium text-main mt-2">${a.name}</p>
        <p class="text-xs text-muted">${a.desc}</p>
      </div>`).join('')}
    </div>`

  const desbloqueablesBlock = `
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
      ${UNLOCKS.map(u => {
        const ok = isUnlocked(u.id)
        return `<div class="unlock-card card text-center py-3 ${ok ? 'unlocked' : 'locked'}">
          <span class="text-2xl">${ok ? u.icon : '🔒'}</span>
          <p class="text-xs font-medium text-main mt-1">${u.name}</p>
          <p class="text-muted" style="font-size:10px">${ok ? u.desc : `Nv. ${u.level}`}</p>
        </div>`
      }).join('')}
    </div>
    ${getNextUnlock() ? `<p class="text-sm text-muted">Próximo: <strong class="text-main">${getNextUnlock().icon} ${getNextUnlock().name}</strong> en nivel ${getNextUnlock().level}</p>` : ''}`

  const tabContent = profileTab === 'resumen' ? resumenBlock
    : profileTab === 'logros' ? logrosBlock
    : desbloqueablesBlock

  return `<div class="animate-fade-in page-shell page-wide page-profile">
    <div class="ds-page ds-page--full">
      ${pageHero(`${rank.icon} ${rank.title}`, `Nivel ${getTotalLevel()} · ${unlocked}/${achievements.length} logros`, getTotalLevel(), 'nivel total')}
      ${profileTabs}
      <div class="ds-panel ds-panel--flat">${tabContent}</div>
    </div>
  </div>`
}
