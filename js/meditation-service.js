/** Calma — estado, racha, programas, sueño, timer libre */

import {
  getToday, toDateStr, getItem, setItem, getStats, updateStats, recordActivity,
  checkPlanTask, addXp, getSettings, saveSettings, DIFFICULTIES,
} from './core.js'
import {
  MEDITATION_STEPS, MEDITATION_PROGRAMS, getMeditationById, getMeditationIntro,
  getSessionAmbient, getProgramCatalog, getProgramDayIntro, getProgramDayPlan,
} from './meditations.js?v=120'
import { playSingingBowl, resumeAudioContext, startAmbientSound, stopAmbientSound, pauseAmbientSound, resumeAmbientSound } from './ambient-audio.js?v=124'
import { isGeminiProgramsEnabled, prefetchGeminiDayContent, hasGeminiContent } from './gemini-meditation-content.js?v=120'
import { playTone } from './sounds.js'
import { forgeSparkAt, pulseElement } from './fx.js?v=96'
import {
  initMeditationVoice, speakMeditation, speakMeditationIntro,
  stopMeditationVoice, pauseMeditationVoice, resumeMeditationVoice, resetBreathCues,
  getMeditationVoiceName, isMeditationVoiceSupported, getStepSpeechText,
  usesApiMedVoice, warmMeditationVoiceCache, speakGuidedMeditationOpen,
  estimateSpeechDurationSec, isMeditationVoiceSpeaking, setProgramVoiceOverride,
} from './meditation-voice.js?v=124'

export const MED_DURATIONS = { facil: 3, medio: 5, dificil: 8, experto: 12 }

export const medState = {
  session: null,
  difficulty: 'medio',
  completed: false,
  completedMin: 0,
  totalSec: 0,
  phase: 'inhale',
  elapsed: 0,
  step: 0,
  stepElapsed: 0,
  steps: [],
  sessionName: '',
  ambientPreview: false,
  ambientType: null,
  ambientAuto: false,
  ambientDockOpen: false,
  ambientMuted: null,
  view: 'hub',
  activeProgram: null,
  programContext: null,
  lastCompletion: null,
  freeTimer: null,
  voiceEnabled: true,
  timerHint: '',
  paused: false,
  geminiPreparing: false,
  contentSource: null,
  sessionIntro: null,
}

/** Ritmo del guion — no comprime el contenido, solo ajusta pausas */
const STEP_PACE = { facil: 1.12, medio: 1, dificil: 0.94, experto: 0.88 }

function migrateProgramData(data) {
  if (!data) return null
  if (data.completedSessions) return data
  const days = data.completedDays || []
  return {
    ...data,
    completedSessions: days.map((date, i) => ({ day: i + 1, date, sessionId: null, minutes: 0 })),
    lastCompletedDate: days[days.length - 1] || null,
    currentDay: days.length + 1,
  }
}

function loadProgramData(programId) {
  const raw = getItem('meditationPrograms', {})[programId]
  return migrateProgramData(raw)
}

function saveProgramData(programId, data) {
  const p = getItem('meditationPrograms', {})
  p[programId] = data
  setItem('meditationPrograms', p)
}

/** Duración calibrada: guion + voz + pausas de integración */
export function buildSessionPlan(id, difficulty = 'medio', voiceEnabled = medState.voiceEnabled, stepsOverride = null) {
  const meta = getMeditationById(id)
  const pace = STEP_PACE[difficulty] || 1

  if (!meta || meta.type === 'breathing') {
    const minutes = MED_DURATIONS[difficulty] || 5
    return { totalSec: minutes * 60, steps: [], minutes, guided: false, ambient: getSessionAmbient(id) }
  }

  const raw = stepsOverride || getMeditationSteps(id)
  if (!raw.length) {
    const minutes = MED_DURATIONS[difficulty] || 5
    return { totalSec: minutes * 60, steps: [], minutes, guided: false, ambient: getSessionAmbient(id) }
  }

  const steps = raw.map(s => {
    const text = getStepSpeechText(s)
    const speechSec = voiceEnabled ? estimateSpeechDurationSec(text) : 0
    const paced = Math.max(32, Math.round(s.duration * pace))
    return { ...s, duration: Math.max(paced, speechSec) }
  })
  const totalSec = steps.reduce((a, s) => a + s.duration, 0)
  const minutes = Math.max(1, Math.round(totalSec / 60))
  return { totalSec, steps, minutes, guided: true, ambient: getSessionAmbient(id) }
}

export function getSessionDurationMinutes(id, difficulty = medState.difficulty || 'medio') {
  return buildSessionPlan(id, difficulty).minutes
}

export function getNaturalSessionMinutes(id) {
  return buildSessionPlan(id, 'medio').minutes
}

/** Milisegundos por fase respiratoria — más lento = más calmado */
export function getBreathPhaseMs() {
  const map = { facil: 7000, medio: 6500, dificil: 6000, experto: 5500 }
  return map[medState.difficulty] || 6500
}

let medTimers = []

export function clearMedTimers() {
  medTimers.forEach(t => clearInterval(t))
  medTimers = []
}

export function stopMeditationSession() {
  clearMedTimers()
  stopAmbientSound()
  stopMeditationVoice()
  setProgramVoiceOverride(null)
  medState.ambientPreview = false
  medState.freeTimer = null
  medState.paused = false
  medState.geminiPreparing = false
  medState.contentSource = null
  medState.sessionIntro = null
}

export function pauseMeditationSession() {
  if (!medState.session && !medState.freeTimer?.active) return
  if (medState.paused) return
  medState.paused = true
  clearMedTimers()
  pauseAmbientSound()
  pauseMeditationVoice()
  if (typeof window.patchLiveUI === 'function' && window.patchLiveUI('/meditacion')) return
  if (typeof window.render === 'function') window.render()
}

export function resumeMeditationSession() {
  if (!medState.paused) return
  medState.paused = false
  if (medState.freeTimer?.active) attachFreeTimerInterval()
  else if (medState.session) {
    attachMeditationTimers(medState.session)
  }
  resumeAmbientSound()
  if (medState.voiceEnabled) {
    const step = medState.steps?.[medState.step]
    if (step) setTimeout(() => speakStep(step), 500)
    else if (medState.session === 'breathing' || medState.session === 'box-breath') {
      setTimeout(() => speakMeditationIntro(getMeditationIntro(medState.session)), 500)
    }
  }
  if (typeof window.patchLiveUI === 'function' && window.patchLiveUI('/meditacion')) return
  if (typeof window.render === 'function') window.render()
}

export function toggleMeditationPause() {
  if (medState.paused) resumeMeditationSession()
  else pauseMeditationSession()
}

export function syncMedVoiceFromSettings() {
  const s = getSettings()
  medState.voiceEnabled = s.medVoice !== false && isMeditationVoiceSupported()
}

export function setMedVoiceEnabled(on) {
  if (!isMeditationVoiceSupported()) return
  const enabled = !!on
  medState.voiceEnabled = enabled
  const s = getSettings()
  s.medVoice = enabled
  saveSettings(s)
  if (!enabled) stopMeditationVoice()
  else initMeditationVoice()
}

export function getMedVoiceLabel() {
  if (!isMeditationVoiceSupported()) return 'No disponible'
  if (!medState.voiceEnabled) return 'Desactivada'
  if (!getMeditationVoiceName() || getMeditationVoiceName() === 'Sin voz de calidad') return 'Cargando…'
  return getMeditationVoiceName()
}

async function restoreSessionAmbient(sessionId) {
  const settings = getSettings()
  const sid = sessionId || medState.session
  let type = settings.medAmbient
  if (!type || type === 'off' || type === 'auto') {
    type = getSessionAmbient(sid)
    medState.ambientAuto = true
  } else {
    medState.ambientAuto = false
  }
  const vol = medAmbientVol(settings)
  try {
    const ok = await startAmbientSound(type, vol)
    medState.ambientPreview = ok
    medState.ambientType = ok ? type : null
    if (ok && medState.ambientAuto) {
      const s = getSettings()
      s.medAmbientSession = type
      saveSettings(s)
    }
  } catch (_) {
    medState.ambientPreview = false
    medState.ambientType = null
  }
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
}

function advanceProgramDay(programId, sessionId, minutes) {
  const program = MEDITATION_PROGRAMS.find(p => p.id === programId)
  if (!program) return null

  const data = loadProgramData(programId) || { started: getToday(), completedSessions: [], currentDay: 1 }
  const completed = data.completedSessions?.length || 0
  if (completed >= program.days) return null
  if (data.lastCompletedDate === getToday()) return null

  const today = getToday()
  const scheduledSessionId = program.schedule[completed] || sessionId
  data.completedSessions.push({
    day: completed + 1,
    date: today,
    sessionId,
    scheduledSessionId,
    minutes,
  })
  data.lastCompletedDate = today
  data.currentDay = completed + 2
  data.completedDays = data.completedSessions.map(s => s.date)
  saveProgramData(programId, data)

  const newCompleted = completed + 1
  const nextId = program.schedule[newCompleted]
  const dayPlan = getProgramDayPlan(programId, newCompleted)
  const nextPlan = nextId ? getProgramDayPlan(programId, newCompleted + 1) : null
  return {
    programId,
    programName: program.name,
    day: newCompleted,
    dayTitle: dayPlan?.title || null,
    totalDays: program.days,
    percent: Math.round((newCompleted / program.days) * 100),
    done: newCompleted >= program.days,
    nextSession: nextId ? getMeditationById(nextId) : null,
    nextDayTitle: nextPlan?.title || null,
  }
}

function tryAdvanceProgram(sessionId, minutes) {
  const ctx = medState.programContext
  if (!ctx?.programId) return null

  const prog = getProgramProgress(ctx.programId)
  if (!prog || prog.done || prog.doneToday) return null

  const scheduledId = prog.program.schedule[prog.completed]
  const eligible = ctx.fromProgramUI || sessionId === scheduledId
  if (!eligible) return null

  return advanceProgramDay(ctx.programId, sessionId, minutes)
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
  const data = loadProgramData(programId)
  const program = MEDITATION_PROGRAMS.find(p => p.id === programId)
  if (!program) return null
  const completedSessions = data?.completedSessions || []
  const completed = completedSessions.length
  const currentDay = Math.min(completed + 1, program.days)
  const today = getToday()
  return {
    program,
    started: data?.started || null,
    completedSessions,
    completedDays: completedSessions.map(s => s.date),
    completed,
    currentDay,
    percent: Math.round((completed / program.days) * 100),
    done: completed >= program.days,
    lastCompletedDate: data?.lastCompletedDate || null,
    doneToday: data?.lastCompletedDate === today,
  }
}

export function getProgramTimeline(programId) {
  const prog = getProgramProgress(programId)
  if (!prog) return []
  return prog.program.schedule.map((sessionId, i) => {
    const day = i + 1
    const record = prog.completedSessions.find(s => s.day === day)
    const meta = getMeditationById(sessionId)
    const plan = getProgramDayPlan(programId, day)
    return {
      day,
      sessionId,
      session: meta,
      title: plan?.title || meta?.name || sessionId,
      intention: plan?.intention || meta?.desc || '',
      skill: plan?.skill || '',
      phase: plan?.phase || '',
      done: i < prog.completed,
      isToday: !prog.done && !prog.doneToday && day === prog.currentDay,
      record,
      ambient: getSessionAmbient(sessionId),
    }
  })
}

export function getProgramTodayPlan(programId) {
  const dayNum = getProgramDayNumber(programId)
  return getProgramDayPlan(programId, dayNum)
}

export function getProgramCatalogInfo(programId) {
  const prog = MEDITATION_PROGRAMS.find(p => p.id === programId)
  const catalog = getProgramCatalog(programId)
  if (!prog || !catalog) return null
  return {
    ...catalog,
    id: programId,
    days: prog.days,
    name: prog.name,
    desc: prog.desc,
    purpose: prog.purpose || catalog.purpose,
    promise: prog.promise || catalog.outcome,
    audience: prog.audience || catalog.audience,
  }
}

export function getActiveProgramProgress() {
  const active = getItem('meditationProgramsActive', null)
  if (!active) return null
  return { active, ...getProgramProgress(active) }
}

export function startMeditationProgram(programId) {
  const existing = loadProgramData(programId)
  if (!existing) {
    saveProgramData(programId, {
      started: getToday(),
      completedSessions: [],
      completedDays: [],
      currentDay: 1,
      lastCompletedDate: null,
    })
  }
  setItem('meditationProgramsActive', programId)
  medState.activeProgram = programId
  medState.view = 'program'
}

export function isProgramCompletedToday(programId) {
  return !!getProgramProgress(programId)?.doneToday
}

export function getProgramDayNumber(programId) {
  const prog = getProgramProgress(programId)
  if (!prog || prog.done) return prog?.program?.days || 0
  if (prog.doneToday) return prog.completed
  return prog.currentDay
}

export function getProgramSessionForToday(programId) {
  const prog = getProgramProgress(programId)
  if (!prog || prog.done || prog.doneToday) return null
  const sessionId = prog.program.schedule[prog.completed]
  return sessionId ? getMeditationById(sessionId) : null
}

export function startProgramSession(programId, sessionId) {
  return startMeditation(sessionId, { fromProgram: programId })
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
  const v = Number(s?.medAmbientVolume ?? 0.28)
  if (v <= 0) return 0
  return Math.max(0.12, Math.min(0.65, v))
}

function speakStep(step) {
  if (!medState.voiceEnabled || !step || medState.paused) return
  const text = getStepSpeechText(step)
  if (!text) return
  speakMeditation(text, { interrupt: true, pauseMs: usesApiMedVoice() ? 2400 : undefined })
}

function attachMeditationTimers(sessionId) {
  const total = medState.totalSec || (medState.completedMin * 60)
  const phaseMs = getBreathPhaseMs()

  if (sessionId === 'breathing' || sessionId === 'box-breath') {
    medTimers.push(setInterval(() => {
      if (medState.paused) return
      medState.phase = medState.phase === 'inhale' ? 'hold' : medState.phase === 'hold' ? 'exhale' : 'inhale'
      playTone(medState.phase === 'inhale' ? 330 : 220, 0.12)
      if (typeof window.patchLiveUI === 'function' && window.patchLiveUI('/meditacion')) return
      if (typeof window.render === 'function') window.render()
    }, phaseMs))
  }

  medTimers.push(setInterval(() => {
    if (medState.paused) return
    medState.elapsed++
    if (medState.steps?.length) {
      medState.stepElapsed++
      const step = medState.steps[medState.step]
      const lastIdx = medState.steps.length - 1
      if (step && medState.stepElapsed >= step.duration) {
        if (medState.voiceEnabled && isMeditationVoiceSpeaking()) {
          medState.totalSec++
          return
        }
        if (medState.step < lastIdx) {
          medState.step++
          medState.stepElapsed = 0
          const next = medState.steps[medState.step]
          if (medState.voiceEnabled && usesApiMedVoice()) {
            const warm = medState.steps.slice(medState.step + 1, medState.step + 4).map(getStepSpeechText)
            warmMeditationVoiceCache(warm)
          }
          speakStep(next)
        } else {
          finishMeditationTimer(sessionId)
          return
        }
      }
    } else if (medState.elapsed >= total) {
      finishMeditationTimer(sessionId)
    }
    if (!(typeof window.patchLiveUI === 'function' && window.patchLiveUI('/meditacion'))) {
      if (typeof window.render === 'function') window.render()
    }
  }, 1000))
}

function attachFreeTimerInterval() {
  medTimers.push(setInterval(() => {
    if (medState.paused || !medState.freeTimer?.active) return
    medState.freeTimer.elapsed++
    const target = medState.freeTimer.targetMin * 60
    if (!medState.freeTimer.open && medState.freeTimer.elapsed >= target) {
      finishFreeTimer()
    } else if (!(typeof window.patchLiveUI === 'function' && window.patchLiveUI('/meditacion'))) {
      if (typeof window.render === 'function') window.render()
    }
  }, 1000))
}

export async function prepareProgramSessionContent(programId, sessionId) {
  const dayNum = getProgramDayNumber(programId)
  const baseIntro = getProgramDayIntro(programId, dayNum)
  const baseSteps = getMeditationSteps(sessionId)
  if (!isGeminiProgramsEnabled()) {
    return { intro: baseIntro, steps: baseSteps, source: 'static' }
  }
  medState.geminiPreparing = true
  if (typeof window.render === 'function') window.render(true)
  try {
    return await prefetchGeminiDayContent(programId, dayNum, sessionId, baseSteps, baseIntro)
  } finally {
    medState.geminiPreparing = false
  }
}

export async function startMeditation(id, options = {}) {
  stopMeditationSession()
  syncMedVoiceFromSettings()
  initMeditationVoice()
  resetBreathCues()

  const diff = medState.difficulty || 'medio'
  let intro = getMeditationIntro(id)
  let stepsOverride = null
  let contentSource = 'static'

  medState.programContext = options.fromProgram
    ? { programId: options.fromProgram, fromProgramUI: true }
    : null

  if (options.fromProgram) {
    const dayNum = getProgramDayNumber(options.fromProgram)
    intro = getProgramDayIntro(options.fromProgram, dayNum)
    if (isGeminiProgramsEnabled()) {
      const baseSteps = getMeditationSteps(id)
      if (baseSteps.length) {
        const enhanced = await prepareProgramSessionContent(options.fromProgram, id)
        intro = enhanced.intro || intro
        stepsOverride = enhanced.steps
        contentSource = enhanced.source || 'static'
      }
    }
  }

  const plan = buildSessionPlan(id, diff, medState.voiceEnabled, stepsOverride)
  const meta = getMeditationById(id)
  medState.session = id
  medState.completed = false
  medState.lastCompletion = null
  medState.completedMin = plan.minutes
  medState.totalSec = plan.totalSec
  medState.phase = 'inhale'
  medState.elapsed = 0
  medState.step = 0
  medState.stepElapsed = 0
  medState.steps = plan.steps
  medState.sessionName = meta?.name || 'Meditación'
  medState.sessionIntro = intro
  medState.contentSource = contentSource
  medState.freeTimer = null
  medState.paused = false
  medState.view = 'session'

  if (typeof window.navigate === 'function') window.navigate(`/meditacion/sesion/${id}`)
  else if (typeof window.render === 'function') window.render(true)

  await resumeAudioContext()

  const settings = getSettings()
  if (settings.sound) await playSingingBowl('start')
  await restoreSessionAmbient(id)

  if (medState.voiceEnabled) {
    if (id === 'breathing' || id === 'box-breath') {
      speakMeditationIntro(intro)
    } else if (medState.steps[0]) {
      const firstVoice = getStepSpeechText(medState.steps[0])
      const warmTexts = [intro, ...medState.steps.map(getStepSpeechText)].filter(Boolean)
      warmMeditationVoiceCache(warmTexts)
      speakGuidedMeditationOpen(intro, firstVoice)
    }
  }

  attachMeditationTimers(id)
}

export function hasGeminiProgramContent() {
  return hasGeminiContent()
}

export async function startFreeTimer(minutes = 10) {
  stopMeditationSession()
  medState.freeTimer = { active: true, targetMin: minutes, elapsed: 0, open: minutes <= 0 }
  medState.session = 'free-timer'
  medState.sessionName = minutes > 0 ? `Timer ${minutes} min` : 'Timer libre'
  medState.paused = false

  await resumeAudioContext()
  await restoreSessionAmbient()
  attachFreeTimerInterval()

  if (typeof window.navigate === 'function') window.navigate('/meditacion/timer')
  else if (typeof window.render === 'function') window.render()
}

function finishMeditationTimer(sessionId) {
  clearMedTimers()
  stopAmbientSound()
  if (getSettings().sound) playSingingBowl('end')
  const minutes = Math.max(1, Math.round(medState.elapsed / 60))
  medState.completedMin = minutes
  const programAdvance = tryAdvanceProgram(sessionId, minutes)
  medState.lastCompletion = { programAdvance, sessionId, minutes }
  completeMeditationSession({ sessionId, minutes, kind: 'guided' })
  medState.completed = true
  medState.programContext = null
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
  if (sub[0] === 'sesion' && sub[1]) {
    medState.view = 'session'
    return
  }
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
