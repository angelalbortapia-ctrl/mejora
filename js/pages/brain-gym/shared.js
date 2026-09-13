/** Estado compartido y runtime del laboratorio cerebral */

import { esc, DIFFICULTIES } from '/js/core.js'
import { EXERCISES, COGNITIVE_DOMAINS } from '/js/brain-program.js'

export let brainState = {
  exercise: null, difficulty: 'medio', mode: 'hub', brainView: 'home', trainSection: 'program', bodySection: 'nutrition',
  schoolFaculty: null, schoolSection: 'curriculum',
  catalogFilter: { q: '', category: 'all', faculty: 'all', region: 'all', duration: 'all', status: 'all' },
  libraryFilter: { q: '', topic: 'all' }, pubmed: { query: '', results: [], loading: false },
  activePaper: null, paperMeta: null, reviewFlow: null,
  activeLesson: null, lessonFlow: null,
  session: null, protocolBrief: null, memory: {}, math: {}, simon: {}, logic: {},
  nback: {}, stroop: {}, flanker: {}, switching: {}, gonogo: {}, corsi: {}, symbols: {},
  visnback: {}, trail: {}, wisconsin: {}, ant: {},
  reaction: {}, anagram: {}, oddout: {},
  gameMeta: { streak: 0, bestStreak: 0, lastRt: null },
}

export let brainTimers = []
let _mathTimer = null
export function setMathTimer(t) { _mathTimer = t }
export function getMathTimer() { return _mathTimer }

let trialDeadlineTimer = null
let exerciseRenderRAF = null
let exerciseRenderLock = false
let renderExerciseFn = () => ''
let syncChromeFn = () => {}
let patchTrialHudFn = () => false
let getLiveStatusFn = () => ({})

export function wireBrainRuntime({ renderExercise, syncChrome, patchTrialHud, getLiveStatus }) {
  renderExerciseFn = renderExercise
  syncChromeFn = syncChrome
  patchTrialHudFn = patchTrialHud
  getLiveStatusFn = getLiveStatus
}

export function flushExerciseRender() {
  const stage = document.getElementById('brain-exercise-stage')
  if (!brainState.exercise || !stage) return
  if (exerciseRenderLock) return
  exerciseRenderLock = true
  brainState._patchOnly = true
  try {
    stage.innerHTML = renderExerciseFn()
    syncChromeFn()
    patchTrialHudFn()
    requestAnimationFrame(() => {
      const focusEl = document.getElementById('revspan-input')
        || document.getElementById('pasat-answer')
        || document.getElementById('math-answer')
      focusEl?.focus()
    })
  } catch (err) {
    console.error('[brain-lab] render error', brainState.exercise, err)
    brainState._patchOnly = false
    exerciseRenderLock = false
    if (typeof window.render === 'function') window.render(true)
    return
  } finally {
    brainState._patchOnly = false
    exerciseRenderLock = false
  }
}

export function render(immediate = false) {
  const stage = document.getElementById('brain-exercise-stage')
  if (brainState.exercise && stage) {
    if (immediate) {
      if (exerciseRenderRAF) cancelAnimationFrame(exerciseRenderRAF)
      exerciseRenderRAF = null
      flushExerciseRender()
      return
    }
    if (exerciseRenderRAF) return
    exerciseRenderRAF = requestAnimationFrame(() => {
      exerciseRenderRAF = null
      flushExerciseRender()
    })
    return
  }
  if (typeof window.render === 'function') window.render(immediate || !!brainState.exercise)
}

export function bumpCombo(correct) {
  const g = brainState.gameMeta
  if (correct) {
    g.streak += 1
    g.bestStreak = Math.max(g.bestStreak, g.streak)
    g.multiplier = Math.min(3, 1 + g.streak * 0.12)
  } else {
    g.streak = 0
    g.multiplier = 1
  }
}

export function markTrial(correct, rt = null) {
  bumpCombo(correct)
  if (rt != null) brainState.gameMeta.lastRt = Math.round(rt)
}

export function brainHud(current, total, label = '') {
  const g = brainState.gameMeta
  const pct = total > 0 ? Math.round((current / total) * 100) : 0
  return `<div class="brain-lab-metrics" aria-label="Progreso">
    <div class="brain-lab-metrics__row">
      <span class="brain-lab-metrics__label">${esc(label || 'Progreso')}</span>
      <span class="brain-lab-metrics__value">${current}/${total}</span>
    </div>
    <div class="brain-lab-metrics__track"><div class="brain-lab-metrics__fill" style="width:${pct}%"></div></div>
    <div class="brain-lab-metrics__meta">
      ${g.streak > 1 ? `<span class="brain-lab-metrics__streak">Racha ${g.streak}</span>` : ''}
      ${g.lastRt ? `<span class="brain-lab-metrics__rt">${g.lastRt} ms</span>` : ''}
      ${g.multiplier > 1 ? `<span class="brain-lab-metrics__mult">×${g.multiplier.toFixed(1)}</span>` : ''}
    </div>
  </div>`
}

export function clearTrialDeadline() {
  if (trialDeadlineTimer) {
    clearInterval(trialDeadlineTimer)
    trialDeadlineTimer = null
  }
  brainState.trialDeadlineMs = null
  brainState.trialTimeLeft = null
}

export function startTrialDeadline(ms, onExpire) {
  clearTrialDeadline()
  if (!ms || ms <= 0) return
  brainState.trialDeadlineMs = ms
  brainState.trialTimeLeft = ms
  const start = Date.now()
  trialDeadlineTimer = setInterval(() => {
    const left = ms - (Date.now() - start)
    brainState.trialTimeLeft = left
    if (left <= 0) {
      clearTrialDeadline()
      onExpire()
    } else {
      patchTrialHudFn()
      syncChromeFn()
    }
  }, 50)
}

export function brainDelay(fn, ms) {
  const id = setTimeout(fn, ms)
  brainTimers.push(id)
  return id
}

export function clearBrainTimers() {
  brainTimers.forEach(t => { clearTimeout(t); clearInterval(t) })
  brainTimers = []
  clearTrialDeadline()
  if (_mathTimer) {
    clearInterval(_mathTimer)
    _mathTimer = null
  }
}

export function brainFinishPct(score, total, id) {
  if (!total || total <= 0) return 0
  if (id === 'math') return Math.min(100, score * 10)
  if (id === 'memory' || id === 'simon') return Math.min(100, score)
  return Math.min(100, Math.round((score / total) * 100))
}

export function brainFinishBtn(score, total, id, xpLabel = 'Continuar') {
  const finishArg = brainState.mode === 'session' ? score : brainFinishPct(score, total, id)
  const fn = brainState.mode === 'session'
    ? `endExerciseBlock(${score},${total},'${id}')`
    : `finishBrain(${finishArg})`
  return `<button onclick="${fn}" class="btn-primary">${xpLabel}</button>`
}

export function buildArenaBody(content, opts = {}) {
  const pressure = brainState.difficulty === 'experto'
    ? '<p class="brain-lab-pressure brain-lab-pressure--max">Presión máxima · límite de tiempo activo</p>'
    : brainState.difficulty === 'dificil'
      ? '<p class="brain-lab-pressure">Alta demanda cognitiva</p>'
      : ''
  return `<div class="brain-lab-body${opts.arena ? ' brain-lab-body--arena' : ''}">${pressure}${content}</div>`
}

export function renderBrainLabShell(body, opts = {}) {
  const ex = EXERCISES[brainState.exercise] || {}
  const d = DIFFICULTIES[brainState.difficulty]
  const backFn = brainState.mode === 'session' ? 'cancelSession()' : 'exitExercise()'
  const status = getLiveStatusFn()
  const domain = COGNITIVE_DOMAINS[ex.domain]
  return `<div id="brain-lab-runtime" class="page-shell page-brain-lab-runtime route-enter">
    <header class="brain-lab-header" id="brain-lab-header">
      <button type="button" onclick="${backFn}" class="brain-lab-header__exit">Salir</button>
      <div class="brain-lab-header__main">
        <p class="brain-lab-header__domain">${domain?.name || 'Entrenamiento cognitivo'}</p>
        <h1 class="brain-lab-header__title">${ex.name || 'Protocolo'}</h1>
        <p class="brain-lab-header__paradigm">${ex.paradigm || status.paradigm || ''}</p>
      </div>
      <div class="brain-lab-header__telemetry">
        <span class="brain-lab-telemetry__item"><em>Fase</em><strong id="brain-lab-phase">${status.phase || '—'}</strong></span>
        <span class="brain-lab-telemetry__item"><em>Trial</em><strong id="brain-lab-trial">${status.trial || '—'}</strong></span>
        <span class="brain-lab-telemetry__item"><em>Nivel</em><strong>${d.label}</strong></span>
      </div>
      <div class="brain-lab-header__timer" id="brain-lab-timer"><div class="brain-lab-header__timer-fill" id="brain-lab-progress-fill"></div></div>
    </header>
    <main id="brain-exercise-stage" class="brain-lab-stage${opts.arena ? ' brain-lab-stage--arena' : ''}">${body}</main>
  </div>`
}

export function brainWrapper(content, opts = {}) {
  const body = buildArenaBody(content, opts)
  if (brainState._patchOnly) return body
  return renderBrainLabShell(body, opts)
}
