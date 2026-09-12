/** Pomodoro / Enfoque */

import { getItem, setItem, checkPlanTask } from './core.js'
import { awardXp, processPlanAwards } from './awards.js'
import { playTone } from './sounds.js'

export let pomodoro = { minutes: 25, seconds: 0, active: false, mode: 'work' }
export let pomodoroTimer = null

export function patchPomodoroUI() {
  if (!pomodoro.active) return false
  const progress = pomodoro.mode === 'work'
    ? ((25 * 60 - (pomodoro.minutes * 60 + pomodoro.seconds)) / (25 * 60)) * 100
    : ((5 * 60 - (pomodoro.minutes * 60 + pomodoro.seconds)) / (5 * 60)) * 100
  const timerEl = document.getElementById('pomo-timer')
  const progressEl = document.getElementById('pomo-progress')
  const toggleEl = document.getElementById('pomo-toggle-btn')
  if (!timerEl || !progressEl || !toggleEl) return false
  timerEl.textContent = `${String(pomodoro.minutes).padStart(2, '0')}:${String(pomodoro.seconds).padStart(2, '0')}`
  progressEl.setAttribute('stroke-dasharray', `${progress * 2.83} 283`)
  toggleEl.textContent = pomodoro.active ? 'Pausar' : 'Iniciar'
  return true
}

export function togglePomodoro(render) {
  pomodoro.active = !pomodoro.active
  if (pomodoro.active) {
    if (pomodoroTimer) clearInterval(pomodoroTimer)
    pomodoroTimer = setInterval(() => {
      if (pomodoro.seconds === 0 && pomodoro.minutes === 0) {
        pomodoro.active = false
        clearInterval(pomodoroTimer)
        playTone(440, 0.3)
        if (pomodoro.mode === 'work') {
          pomodoro.mode = 'break'
          pomodoro.minutes = 5
          const s = getItem('pomodoroSessions', 0) + 1
          setItem('pomodoroSessions', s)
          awardXp('discipline', 20, 'Sesión de enfoque')
          processPlanAwards(checkPlanTask('focus'))
        } else {
          pomodoro.mode = 'work'
          pomodoro.minutes = 25
        }
        pomodoro.seconds = 0
      } else if (pomodoro.seconds === 0) {
        pomodoro.minutes--
        pomodoro.seconds = 59
      } else pomodoro.seconds--
      render()
    }, 1000)
  } else if (pomodoroTimer) clearInterval(pomodoroTimer)
  render()
}

export function resetPomodoro(render) {
  pomodoro.active = false
  if (pomodoroTimer) clearInterval(pomodoroTimer)
  pomodoro.minutes = pomodoro.mode === 'work' ? 25 : 5
  pomodoro.seconds = 0
  render()
}
