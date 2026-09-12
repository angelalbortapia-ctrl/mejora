/** Calma — estado, racha, programas, sueño, timer libre */

import {
  getToday, toDateStr, getItem, setItem, getStats, updateStats, recordActivity,
  checkPlanTask, addXp, getSettings, DIFFICULTIES,
} from './core.js'
import { MEDITATION_STEPS, MEDITATION_PROGRAMS, getMeditationById } from './meditations.js?v=78'
import { playSingingBowl, resumeAudioContext, startAmbientSound, stopAmbientSound } from './ambient-audio.js'
import { playTone } from './sounds.js'
import { forgeSparkAt, pulseElement } from './fx.js'

export const MED_DURATIONS = { facil: 3, medio: 5, dificil: 8, experto: 12 }

export const medState = {
  session: null,
  difficulty: 'medio',
  completed: false,
  completedMin: 0,
  phase: 'inhale',
  elapsed: 0,
  step: 0,
  stepElapsed: 0,
  steps: [],
  sessionName: '',
  ambientPreview: false,
  view: 'hub',
  activeProgram: null,
  freeTimer: null,
  voiceEnabled: false,
  timerHint: '',
}

let medTimers = []

export function clearMedTimers() {
  medTimers.forEach(t => clearInterval(t))
  medTimers = []
}

export function stopMeditationSession() {
  clearMedTimers()
  stopAmbientSound()
  medState.ambientPreview = false
  medState.freeTimer = null
}

export function getMeditationSteps(id) {
  const meta = getMeditationById(id)
  if (!meta || meta.type !== 'steps' || !meta.stepsKey) return []
  return MEDITATION_STEPS[meta.stepsKey] || []
}

function getMeditationLog() {
  return getItem('meditationLog', {})
}

function saveMeditationLog(log) {
  setItem('meditationLog', log)
}

/** Racha independiente de meditación (días con al menos 1 sesión) */
export function getMeditationStreak() {
  const log = getMeditationLog()
  let streak = 0
  const d = new Date()
  const today = getToday()
  if (!log[today]) d.setDate(d.getDate() - 1)

  for (let i = 0; i < 365; i++) {
    const dateStr = toDateStr(d)
    if (log[dateStr]?.sessions?.length) {
      streak++
      d.setDate(d.getDate() - 1)
    } else break
  }
  return streak
}

export function getMeditationStats() {
  const log = getMeditationLog()
  const days = Object.keys(log).length
  let sessions = 0
  let minutes = 0
  Object.values(log).forEach(day => {
    sessions += day.sessions?.length || 0
    minutes += day.minutes || 0
  })
  return { days, sessions, minutes, streak: getMeditationStreak() }
}

function logMeditationSession({ sessionId, minutes, kind = 'guided' }) {
  const today = getToday()
  const log = getMeditationLog()
  if (!log[today]) log[today] = { sessions: [], minutes: 0 }
  log[today].sessions.push({ id: sessionId || kind, minutes, kind, at: Date.now() })
  log[today].minutes += minutes
  saveMeditationLog(log)

  const prog = getActiveProgramProgress()
  if (prog?.active) {
    const p = getItem('meditationPrograms', {})
    const key = prog.active
    if (!p[key]) p[key] = { started: getToday(), completedDays: [] }
    if (!p[key].completedDays.includes(today)) {
      p[key].completedDays.push(today)
      setItem('meditationPrograms', p)
    }
  }
}

export function completeMeditationSession({ sessionId, minutes, kind = 'guided' }) {
  const diff = medState.difficulty || 'medio'
  const xp = DIFFICULTIES[diff]?.xp || 35
  logMeditationSession({ sessionId, minutes, kind })
  recordActivity('meditation')
  addXp('mindfulness', xp, 'Meditación completada')
  updateStats({ meditationMinutes: getStats().meditationMinutes + minutes })
  processPlanAwards(checkPlanTask('meditation'))
  if (new Date().getHours() >= 18) processPlanAwards(checkPlanTask('evening'))
}

function processPlanAwards(awarded) {
  if (!awarded?.length) return
  if (typeof window.processPlanAwards === 'function') window.processPlanAwards(awarded)
}

/** Programas 7 / 21 / 30 días */
export function getProgramProgress(programId) {
  const data = getItem('meditationPrograms', {})[programId]
  const program = MEDITATION_PROGRAMS.find(p => p.id === programId)
  if (!program) return null
  const completed = data?.completedDays?.length || 0
  return {
    program,
    started: data?.started || null,
    completedDays: data?.completedDays || [],
    completed,
    percent: Math.round((completed / program.days) * 100),
    done: completed >= program.days,
  }
}

export function getActiveProgramProgress() {
  const active = getItem('meditationProgramsActive', null)
  if (!active) return null
  return { active, ...getProgramProgress(active) }
}

export function startMeditationProgram(programId) {
  const p = getItem('meditationPrograms', {})
  if (!p[programId]) p[programId] = { started: getToday(), completedDays: [] }
  setItem('meditationPrograms', p)
  setItem('meditationProgramsActive', programId)
  medState.activeProgram = programId
  medState.view = 'program'
}

export function getProgramSessionForToday(programId) {
  const prog = getProgramProgress(programId)
  if (!prog) return null
  const dayIndex = prog.completedDays.length
  const sessionId = prog.program.schedule[dayIndex % prog.program.schedule.length]
  return getMeditationById(sessionId)
}

/** Sueño */
export function getSleepLog() {
  return getItem('sleepLog', {})
}

export function logSleep(hours, quality) {
  const today = getToday()
  const log = getSleepLog()
  log[today] = { hours: Number(hours), quality: Number(quality), at: Date.now() }
  setItem('sleepLog', log)
}

export function getSleepStats() {
  const log = getSleepLog()
  const entries = Object.values(log)
  if (!entries.length) return { avgHours: 0, avgQuality: 0, nights: 0 }
  const avgHours = entries.reduce((a, e) => a + e.hours, 0) / entries.length
  const avgQuality = entries.reduce((a, e) => a + e.quality, 0) / entries.length
  return { avgHours: Math.round(avgHours * 10) / 10, avgQuality: Math.round(avgQuality * 10) / 10, nights: entries.length }
}

/** Coherencia respiratoria (proxy HRV local) */
export function getBreathCoherenceLog() {
  return getItem('breathCoherence', [])
}

export function logBreathCoherence(score) {
  const log = getBreathCoherenceLog()
  log.push({ score, date: getToday(), at: Date.now() })
  if (log.length > 60) log.shift()
  setItem('breathCoherence', log)
}

export function medAmbientVol(s) {
  const v = Number(s?.medAmbientVolume ?? 0.45)
  if (v <= 0) return 0
  return Math.max(0.2, Math.min(1, v))
}

function speakStep(text) {
  if (!medState.voiceEnabled || !window.speechSynthesis || !text) return
  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.lang = 'es-MX'
  u.rate = 0.92
  window.speechSynthesis.speak(u)
}

export async function startMeditation(id) {
  stopMeditationSession()
  await resumeAudioContext()
  const diff = medState.difficulty || 'medio'
  const duration = MED_DURATIONS[diff]
  const meta = getMeditationById(id)
  medState.session = id
  medState.completed = false
  medState.completedMin = duration
  medState.phase = 'inhale'
  medState.elapsed = 0
  medState.step = 0
  medState.stepElapsed = 0
  medState.steps = getMeditationSteps(id)
  medState.sessionName = meta?.name || 'Meditación'
  medState.freeTimer = null

  const settings = getSettings()
  if (settings.sound) await playSingingBowl('start')
  if (settings.medAmbient && settings.medAmbient !== 'off') {
    await startAmbientSound(settings.medAmbient, medAmbientVol(settings))
  }

  const total = duration * 60

  if (id === 'breathing' || id === 'box-breath') {
    medTimers.push(setInterval(() => {
      medState.phase = medState.phase === 'inhale' ? 'hold' : medState.phase === 'hold' ? 'exhale' : 'inhale'
      playTone(medState.phase === 'inhale' ? 330 : 220, 0.15)
      if (typeof window.patchLiveUI === 'function' && window.patchLiveUI('/meditacion')) return
      if (typeof window.render === 'function') window.render()
    }, diff === 'experto' ? 3000 : 4000))
  }

  if (medState.steps[0]?.text) speakStep(medState.steps[0].text)

  medTimers.push(setInterval(() => {
    medState.elapsed++
    if (medState.steps?.length) {
      medState.stepElapsed++
      const step = medState.steps[medState.step]
      if (step && medState.stepElapsed >= step.duration && medState.step < medState.steps.length - 1) {
        medState.step++
        medState.stepElapsed = 0
        speakStep(medState.steps[medState.step]?.text)
      }
    }
    if (medState.elapsed >= total) {
      finishMeditationTimer(id, duration)
    } else if (!(typeof window.patchLiveUI === 'function' && window.patchLiveUI('/meditacion'))) {
      if (typeof window.render === 'function') window.render()
    }
  }, 1000))

  if (typeof window.navigate === 'function') window.navigate(`/meditacion/sesion/${id}`)
  else if (typeof window.render === 'function') window.render()
}

export function startFreeTimer(minutes = 10) {
  stopMeditationSession()
  medState.freeTimer = { active: true, targetMin: minutes, elapsed: 0, open: minutes <= 0 }
  medState.session = 'free-timer'
  medState.sessionName = minutes > 0 ? `Timer ${minutes} min` : 'Timer libre'

  medTimers.push(setInterval(() => {
    medState.freeTimer.elapsed++
    const target = medState.freeTimer.targetMin * 60
    if (!medState.freeTimer.open && medState.freeTimer.elapsed >= target) {
      finishFreeTimer()
    } else if (!(typeof window.patchLiveUI === 'function' && window.patchLiveUI('/meditacion'))) {
      if (typeof window.render === 'function') window.render()
    }
  }, 1000))

  if (typeof window.navigate === 'function') window.navigate('/meditacion/timer')
  else if (typeof window.render === 'function') window.render()
}

function finishMeditationTimer(sessionId, duration) {
  clearMedTimers()
  stopAmbientSound()
  if (getSettings().sound) playSingingBowl('end')
  completeMeditationSession({ sessionId, minutes: duration, kind: 'guided' })
  medState.completed = true
  if (typeof window.render === 'function') window.render()
  requestAnimationFrame(() => {
    const ring = document.querySelector('.meditation-ring, .breathe-circle')
    forgeSparkAt(ring, 14)
    pulseElement(ring)
  })
}

export function finishFreeTimer() {
  const elapsed = medState.freeTimer?.elapsed || 0
  if (elapsed < 45) {
    medState.timerHint = 'Mínimo 45 segundos para registrar la sesión.'
    if (typeof window.render === 'function') window.render()
    return false
  }
  medState.timerHint = ''
  const mins = Math.max(1, Math.round(elapsed / 60))
  clearMedTimers()
  stopAmbientSound()
  if (getSettings().sound) playSingingBowl('end')
  const coherence = Math.min(100, 50 + Math.min(mins, 15) * 3)
  logBreathCoherence(coherence)
  completeMeditationSession({ sessionId: 'free-timer', minutes: mins, kind: 'timer' })
  medState.completed = true
  medState.completedMin = mins
  if (typeof window.render === 'function') window.render()
  requestAnimationFrame(() => {
    const ring = document.querySelector('.med-timer-ring, .meditation-ring')
    forgeSparkAt(ring, 12)
    pulseElement(ring)
  })
  return true
}

export function syncMeditationFromRoute(sub = []) {
  if (sub[0] === 'programa' && sub[1]) {
    medState.view = 'program'
    medState.activeProgram = sub[1]
    return
  }
  if (sub[0] === 'timer') {
    medState.view = 'timer'
    return
  }
  if (sub[0] === 'sueño' || sub[0] === 'sueno') {
    medState.view = 'sleep'
    return
  }
  if (!medState.session && !medState.completed) {
    medState.view = 'hub'
    medState.activeProgram = getItem('meditationProgramsActive', null)
  }
}
