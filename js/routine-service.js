/** Estado y lógica de la rutina diaria */

import {
  DIFFICULTIES, getSettings, getStats, updateStats, isRoutineDoneToday, checkPlanTask, recordActivity,
} from '/js/core.js'
import { awardXp, processPlanAwards } from '/js/awards.js'
import { navigate } from '/js/router.js'
import { playTone } from '/js/sounds.js'
import { guardDifficulty } from '/js/page-helpers.js'

const ROUTINE_STROOP_INK = [
  { key: 'rojo', label: 'Rojo', name: 'ROJO', css: '#ef4444' },
  { key: 'azul', label: 'Azul', name: 'AZUL', css: '#3b82f6' },
  { key: 'verde', label: 'Verde', name: 'VERDE', css: '#22c55e' },
]

export let routineState = { active: false, step: 0, difficulty: 'medio' }
export let routineTimers = []

function genRoutineStroop() {
  const ink = ROUTINE_STROOP_INK[Math.floor(Math.random() * ROUTINE_STROOP_INK.length)]
  let word = ROUTINE_STROOP_INK[Math.floor(Math.random() * ROUTINE_STROOP_INK.length)]
  while (word.key === ink.key) word = ROUTINE_STROOP_INK[Math.floor(Math.random() * ROUTINE_STROOP_INK.length)]
  return { ink, word }
}

export function clearRoutineTimers() {
  routineTimers.forEach(t => clearInterval(t))
  routineTimers = []
}

function tickBreathing(render) {
  routineTimers.push(setInterval(() => {
    if (routineState.step !== 1) return
    const b = routineState.breathing
    b.elapsed++
    if (b.elapsed % 4 === 0) b.phase = b.phase === 'inhale' ? 'hold' : b.phase === 'hold' ? 'exhale' : 'inhale'
    if (b.elapsed >= b.total) {
      routineState.step = 2
      routineState.brain.trial = genRoutineStroop()
      render()
      return
    }
    render()
  }, 1000))
}

export function startRoutine(render) {
  if (isRoutineDoneToday()) return
  const diff = routineState.difficulty || getSettings().defaultDifficulty
  const d = DIFFICULTIES[diff]
  clearRoutineTimers()
  routineState = {
    active: true, step: 1, difficulty: diff,
    breathing: { elapsed: 0, phase: 'inhale', total: diff === 'experto' ? 180 : diff === 'dificil' ? 150 : 120 },
    brain: { round: 0, total: 5, score: 0, trial: genRoutineStroop(), feedback: null },
  }
  tickBreathing(render)
  render()
}

export function startExpress(render) {
  if (isRoutineDoneToday()) return
  clearRoutineTimers()
  const diff = 'facil'
  routineState = {
    active: true, step: 1, difficulty: diff, express: true,
    breathing: { elapsed: 0, phase: 'inhale', total: 60 },
    brain: { round: 0, total: 5, score: 0, trial: genRoutineStroop(), feedback: null },
  }
  tickBreathing(render)
  location.hash = '/rutina'
  render()
}

export function finishRoutine(express = false, render) {
  clearRoutineTimers()
  recordActivity('routine')
  const xp = express ? 30 : (DIFFICULTIES[routineState.difficulty]?.xp || 50)
  awardXp('mindfulness', Math.floor(xp * 0.4), 'Rutina completada')
  awardXp('mental', Math.floor(xp * 0.3), 'Mente activa')
  awardXp('wisdom', Math.floor(xp * 0.3), express ? 'Enfoque rápido' : 'Reflexión')
  updateStats({ routinesCompleted: getStats().routinesCompleted + 1 })
  processPlanAwards(checkPlanTask(express ? 'express' : 'routine'))
  routineState = { active: false, step: 4, difficulty: routineState.difficulty, express }
  render()
}

export function stopRoutineIfLeaving(path) {
  if (path === '/rutina') return
  clearRoutineTimers()
  if (routineState.active) {
    routineState = { active: false, step: 0, difficulty: routineState.difficulty || 'medio' }
  }
}

export function exitRoutine() {
  clearRoutineTimers()
  routineState = { active: false, step: 0, difficulty: routineState.difficulty || getSettings().defaultDifficulty || 'medio' }
  navigate('/rutina')
}

export function patchRoutineUI() {
  if (!routineState.active || routineState.step !== 1) return false
  const b = routineState.breathing
  const remainingEl = document.getElementById('routine-remaining')
  const phaseEl = document.getElementById('routine-phase-text')
  const circleEl = document.getElementById('routine-breathe-circle')
  if (!remainingEl || !phaseEl || !circleEl) return false
  const scale = b.phase === 'inhale' ? 1.15 : b.phase === 'exhale' ? 0.85 : 1.05
  const phase = { inhale: 'Inhala', hold: 'Mantén', exhale: 'Exhala' }
  remainingEl.textContent = `${b.total - b.elapsed}s restantes`
  phaseEl.textContent = phase[b.phase]
  circleEl.style.transform = `scale(${scale})`
  return true
}

export { ROUTINE_STROOP_INK, genRoutineStroop, guardDifficulty }
