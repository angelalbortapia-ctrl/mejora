/** Programas de Calma adaptativos — ajuste por consistencia */

import { getToday } from './core.js'
import { MEDITATION_PROGRAMS, getMeditationById } from './meditations.js?v=120'
import { getProgramProgress, getProgramSessionForToday, isProgramCompletedToday } from './meditation-service.js?v=120'

const RECOVERY_SESSIONS = ['reset', 'breathing', 'release', 'transition-breath']

function daysBetween(a, b) {
  const da = new Date(a + 'T12:00:00')
  const db = new Date(b + 'T12:00:00')
  return Math.round((db - da) / 86400000)
}

/** Días sin completar desde el último día del programa */
export function getProgramGapDays(programId) {
  const prog = getProgramProgress(programId)
  if (!prog?.started) return 0
  const completed = prog.completedDays.slice().sort()
  const anchor = completed.length ? completed[completed.length - 1] : prog.started
  return Math.max(0, daysBetween(anchor, getToday()))
}

export function getAdaptiveProgramMode(programId) {
  const gap = getProgramGapDays(programId)
  if (gap >= 3) return 'restart'
  if (gap >= 2) return 'recovery'
  return 'normal'
}

export function getAdaptiveProgramSession(programId) {
  if (isProgramCompletedToday(programId)) {
    return { session: null, mode: 'normal', hint: null, suggestedDifficulty: null, doneToday: true }
  }
  const mode = getAdaptiveProgramMode(programId)
  const scheduled = getProgramSessionForToday(programId)

  if (mode === 'recovery') {
    const gap = getProgramGapDays(programId)
    const recoveryId = RECOVERY_SESSIONS[(gap + programId.length) % RECOVERY_SESSIONS.length]
    const recovery = getMeditationById(recoveryId)
    return {
      session: recovery || scheduled,
      mode,
      hint: 'Semana con pausas — hoy toca sesión corta de recuperación (3 min).',
      suggestedDifficulty: 'facil',
    }
  }

  if (mode === 'restart') {
    return {
      session: getMeditationById('breathing') || scheduled,
      mode,
      hint: 'Retomemos suave: respiración táctica para volver al ritmo.',
      suggestedDifficulty: 'facil',
    }
  }

  return {
    session: scheduled,
    mode: 'normal',
    hint: null,
    suggestedDifficulty: null,
  }
}

export function getAdaptiveProgramBanner(programId) {
  const { mode, hint } = getAdaptiveProgramSession(programId)
  if (mode === 'normal' || !hint) return ''
  const cls = mode === 'restart' ? 'med-adaptive--restart' : 'med-adaptive--recovery'
  return `<div class="med-adaptive-banner ${cls}">
    <span class="med-adaptive-icon">${mode === 'restart' ? '↺' : '🫧'}</span>
    <p class="med-adaptive-text">${hint}</p>
  </div>`
}
