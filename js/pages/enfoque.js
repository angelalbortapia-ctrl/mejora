/** Página Enfoque — Pomodoro */

import { getItem } from '../core.js'
import { pageHero } from '../ui.js'
import { pomodoro, togglePomodoro as togglePomodoroCore, resetPomodoro as resetPomodoroCore } from '../focus-service.js'

export function renderEnfoque() {
  const progress = pomodoro.mode === 'work'
    ? ((25 * 60 - (pomodoro.minutes * 60 + pomodoro.seconds)) / (25 * 60)) * 100
    : ((5 * 60 - (pomodoro.minutes * 60 + pomodoro.seconds)) / (5 * 60)) * 100
  const sessions = getItem('pomodoroSessions', 0)
  const focusClass = pomodoro.active ? ' focus-active' : ''
  return `<div class="animate-fade-in page-shell page-wide page-enfoque route-enter${focusClass}">
    ${pomodoro.active ? '<button onclick="togglePomodoro()" class="btn-secondary focus-exit">← Salir</button>' : ''}
    <div class="ds-page ds-page--full enfoque-dashboard">
    ${pageHero('Enfoque profundo', 'Pomodoro · 25 min trabajo + 5 min descanso', sessions, 'sesiones')}
      <div class="ds-panel text-center enfoque-timer">
        <p class="text-sm text-muted mb-4">${pomodoro.mode === 'work' ? '🍅 Enfoque (25 min)' : '☕ Descanso (5 min)'}</p>
        <div class="relative w-44 h-44 mx-auto mb-8">
          <svg class="w-full h-full" style="transform:rotate(-90deg)" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" fill="none" stroke="var(--border)" stroke-width="6"/>
            <circle id="pomo-progress" cx="50" cy="50" r="45" fill="none" stroke="${pomodoro.mode === 'work' ? '#ff8c69' : 'var(--primary)'}" stroke-width="6" stroke-dasharray="${progress * 2.83} 283" stroke-linecap="round"/>
          </svg>
          <div class="absolute inset-0 flex items-center justify-center"><span id="pomo-timer" class="font-display text-3xl font-bold text-main">${String(pomodoro.minutes).padStart(2, '0')}:${String(pomodoro.seconds).padStart(2, '0')}</span></div>
        </div>
        <div class="flex gap-3 justify-center">
          <button id="pomo-toggle-btn" onclick="togglePomodoro()" class="btn-primary">${pomodoro.active ? 'Pausar' : 'Iniciar'}</button>
          <button onclick="resetPomodoro()" class="btn-secondary">Reiniciar</button>
        </div>
      </div>
      <div class="card enfoque-info">
        <h1 class="font-display text-2xl font-bold text-main mb-2">Enfoque Profundo</h1>
        <p class="text-muted mb-4">Sesiones completadas: <strong class="text-main">${sessions}</strong></p>
        <p class="text-sm text-muted leading-relaxed">Bloques de 25 min de trabajo profundo + 5 min de descanso. Ideal después de completar tu plan del día.</p>
        <a href="#/plan" class="btn-secondary w-full mt-4 block text-center no-underline">Ver plan del día →</a>
      </div>
    </div>
  </div>`
}

export function bindEnfoqueGlobals() {
  const render = () => window.render?.()
  window.togglePomodoro = () => togglePomodoroCore(render)
  window.resetPomodoro = () => resetPomodoroCore(render)
}
