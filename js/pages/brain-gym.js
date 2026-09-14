/** Gimnasia cerebral — escuela, laboratorio, sesiones guiadas */

import {
  getItem, setItem, getToday, esc, getSettings, saveSettings, DIFFICULTIES,
  getStats, updateStats, recordActivity, checkPlanTask, addXp, setRecord,
} from '/js/core.js'
import {
  genMathProblem, getMemoryConfig, getSimonConfig, getLogicPuzzles, pickSequence, COLORS,
  getAnagrams, WORD_GROUPS,
} from '/js/content.js'
import {
  COGNITIVE_DOMAINS, EXERCISES, EXERCISE_GUIDES, getExerciseGuide, getTodaysSession, getDomainProgress, getProgramStats,
  completeSession, isSessionDoneToday, PROGRAM_DISCLAIMER, getExerciseLevel, updateExerciseLevel, CASUAL_EXERCISE_IDS,
} from '/js/brain-program.js'
import {
  initNBack, initStroop, initFlanker, initSwitching, initGoNoGo, initCorsi, corsiGenerateSequence,
  initSymbols, flankerArrows, getSwitchAnswer, STROOP_COLORS,
  initReaction, reactionDelayMs, reactionGoWindowMs, scoreReactionRt, initOddOut, initAnagram, buildAnagramChoices,
  initDualNBack, initCPT, initRevSpan, revSpanGenerate, initPasat,
  initVisNBack, initTrailMaking, initWisconsin, initANT,
  brainTrialCount, getIntensity,
} from '/js/brain-exercises.js'
import {
  logTrial, renderPracticeBanner, renderTrialFlash, renderPaceRing,
  isPractice, beginScoredBlock, PRACTICE_TRIALS, getProtocolHistory, analyzeSessionResults,
  hasSeenProtocolBrief, markProtocolBriefSeen, getClinicalReportExportPayload,
} from '/js/brain-metrics.js'
import { exportClinicalReportPdf } from '/js/pdf-export.js'
import {
  mountClinicalHandlers, CLINICAL_PROTOCOLS, renderStroopSwatches,
  stroopTrialMeta, stroopHudIndex, stroopHudTotal,
} from '/js/brain-clinical-lab.js'
import { subTabBar, emptyState } from '/js/ui.js'
import { playTone, playClick, playSuccess } from '/js/sounds.js'
import { guardDifficulty, difficultyPicker } from '/js/page-helpers.js'
import { showToast, awardXp, processPlanAwards } from '/js/awards.js'
import { parsePath, navigate } from '/js/router.js'
import {
  LESSONS, LAB_EXERCISE_IDS, LAB_EXERCISE_GROUPS, EXERCISE_REAL_WORLD,
  renderLessonFull, renderLessonPostFlow, getLessonQuiz, markLessonComplete, getCompletedLessons,
  getSessionDebrief, isLessonUnlocked, getLessonBonusXp,
} from '/js/brain-academy.js'
import {
  renderSchoolHub, completeLessonReview,
  renderReviewQuizFlow, getReviewQuiz, getSchoolStats, getBrainRegionProgress,
} from '/js/school.js'
import { renderExercise, hasProtocol, destroyActiveProtocol, setActiveProtocol } from '/js/pages/brain-gym/registry.js'
import { initProtocolContext } from '/js/pages/brain-gym/protocol-context.js'
import { buildClinicalProtocolRegistry, registerFreeLabProtocols } from '/js/pages/brain-gym/protocolos/index.js'
import { patchStroopUI } from '/js/pages/brain-gym/protocolos/stroop.js'
import { patchFlankerUI } from '/js/pages/brain-gym/protocolos/flanker.js'
import { patchCatalogUI } from '/js/school-catalog.js'
import { wrapSchoolPage } from '/js/school-shell.js'
import { renderPaperDetail, getPaper, fetchPaperLiveMeta, searchPubMed } from '/js/school-library.js'
import { downloadFacultyCertificate, checkAndIssueCertificates } from '/js/school-certificates.js'
import { renderInicioHub, renderBodyHub } from '/js/brain-wellness.js'
import { mountSynapseField, unmountSynapseField, isSynapseFieldMounted } from '/js/brain-synapse-fx.js'
import { renderNeuralHero } from '/js/brain-neural-theme.js'
import { normalizeBrainView, bindBrainNavGlobals, goTrain, goBrainTab, goLearn } from '/js/brain-nav.js'
import {
  brainState, brainTimers, setMathTimer, getMathTimer, render, flushExerciseRender, markTrial, brainHud,
  clearTrialDeadline, startTrialDeadline, brainDelay, clearBrainTimers,
  brainFinishBtn, brainWrapper, wireBrainRuntime,
} from '/js/pages/brain-gym/shared.js'

let clinicalLab = null
function ensureClinicalLab() {
  if (clinicalLab) return clinicalLab
  clinicalLab = mountClinicalHandlers({
    brainState, render, brainDelay, playTone, markTrial,
    renderProtocolIntro, brainFinishBtn, renderProtocolDebrief,
    brainWrapper, brainHud, brainTimers,
    getIntensity, brainTrialCount,
  })
  return clinicalLab
}

let catalogFilterTimer = null
let lastSynapseView = null
let synapseCanvasEl = null

function resetGameMeta() {
  brainState.gameMeta = { streak: 0, bestStreak: 0, lastRt: null, multiplier: 1 }
}

function patchTrialHudDOM() {
  if (brainState.trialTimeLeft == null || !brainState.trialDeadlineMs) return false
  syncBrainLabChrome()
  return true
}

const TIMED_TRIAL_HANDLERS = {
  switching: () => window.switchAnswer('__timeout__'),
  logic: () => window.logicAnswer(-1),
  sequence: () => window.seqAnswer(-999999),
  anagram: () => window.anagramPick(-1),
  oddout: () => window.oddoutPick(-1),
}

function queueArmTrial() {
  const id = brainState.exercise
  const handler = TIMED_TRIAL_HANDLERS[id]
  if (!handler) return
  brainTimers.push(setTimeout(() => {
    if (brainState.exercise !== id) return
    const ms = getIntensity(brainState.difficulty).timeLimit
    if (!ms) return
    brainState.trialStart = Date.now()
    startTrialDeadline(ms, handler)
  }, 80))
}

function getExerciseLiveStatus() {
  const id = brainState.exercise
  const ex = EXERCISES[id]
  if (!ex) return { trial: '', phase: '' }
  if (brainState.protocolBrief === id) return { trial: '', phase: 'Briefing' }
  const phase = (() => {
    if (id === 'nback') return brainState.nback.phase === 'play' ? 'Estímulo' : 'Listo'
    if (id === 'dualnback') return brainState.dualnback.phase === 'play' ? 'Estímulo' : 'Listo'
    if (id === 'cpt') return brainState.cpt.phase === 'play' ? 'Vigilancia' : 'Listo'
    if (id === 'pasat') return brainState.pasat.phase === 'play' ? 'Suma' : 'Listo'
    if (id === 'revspan') {
      const s = brainState.revspan
      if (s.phase === 'showing') return 'Memoriza'
      if (s.phase === 'input') return 'Respuesta'
      return 'Listo'
    }
    if (id === 'corsi') {
      const c = brainState.corsi
      if (c.phase === 'showing') return 'Secuencia'
      if (c.phase === 'input') return 'Repite'
      return 'Listo'
    }
    if (id === 'gonogo') {
      const g = brainState.gonogo
      if (!g.started) return 'Briefing'
      if (g.waiting) return 'Prepárate'
      return g.trials[g.index]?.type === 'nogo' ? 'Inhibe' : 'Go'
    }
    if (id === 'reaction') {
      const r = brainState.reaction
      if (r.phase === 'wait') return 'Espera'
      if (r.phase === 'go') return 'Responde'
      return 'Listo'
    }
    return 'Activo'
  })()
  const trial = (() => {
    if (id === 'nback') { const s = brainState.nback; return s.finished ? '' : `Trial ${Math.min(s.index + 1, s.total)}/${s.total}` }
    if (id === 'dualnback') { const s = brainState.dualnback; return s.finished ? '' : `Trial ${Math.min(s.index + 1, s.total)}/${s.total}` }
    if (id === 'stroop') { const s = brainState.stroop; return s.finished ? '' : `${s.index + 1}/${s.total}` }
    if (id === 'flanker') { const s = brainState.flanker; return s.finished ? '' : `${s.index + 1}/${s.total}` }
    if (id === 'switching') { const s = brainState.switching; return s.finished ? '' : `${s.index + 1}/${s.total}` }
    if (id === 'cpt') { const s = brainState.cpt; return s.finished ? '' : `${s.index + 1}/${s.total}` }
    if (id === 'pasat') { const s = brainState.pasat; return s.finished ? '' : `${s.index}/${s.total - 1}` }
    if (id === 'symbols') { const s = brainState.symbols; return s.finished ? '' : `${s.index + 1}/${s.total}` }
    if (id === 'logic') { const l = brainState.logic; return l.finished ? '' : `${l.index + 1}/${l.puzzles.length}` }
    if (id === 'reaction') { const r = brainState.reaction; return r.finished ? '' : `${r.index + 1}/${r.total}` }
    return ''
  })()
  return { trial, phase, paradigm: ex.paradigm, name: ex.name }
}

function syncBrainLabChrome() {
  const status = getExerciseLiveStatus()
  const trialEl = document.getElementById('brain-lab-trial')
  const phaseEl = document.getElementById('brain-lab-phase')
  if (trialEl) trialEl.textContent = status.trial || '—'
  if (phaseEl) phaseEl.textContent = status.phase || '—'
  const prog = document.getElementById('brain-lab-progress-fill')
  if (prog) {
    const pct = brainState.trialDeadlineMs && brainState.trialTimeLeft != null
      ? Math.max(0, Math.round((brainState.trialTimeLeft / brainState.trialDeadlineMs) * 100))
      : null
    if (pct != null) {
      prog.style.width = `${pct}%`
      prog.parentElement?.classList.toggle('is-urgent', pct < 25)
    }
  }
}
// --- Brain Gym (programa neurociencia + academia) ---
function getLabExercises() {
  return LAB_EXERCISE_IDS.map(id => EXERCISES[id]).filter(Boolean)
}

function exerciseTierTag(exId) {
  if (CLINICAL_PROTOCOLS.has(exId)) return '<span class="brain-protocol-tag brain-protocol-tag--clinical">Protocolo clínico</span>'
  if (CASUAL_EXERCISE_IDS.has(exId)) return '<span class="brain-protocol-tag brain-protocol-tag--casual">Entrenamiento casual</span>'
  return ''
}

function renderLabGameCard(ex) {
  const dom = COGNITIVE_DOMAINS[ex.domain]
  const guide = getExerciseGuide(ex.id)
  const rw = guide?.life || EXERCISE_REAL_WORLD[ex.id]
  const adaptive = ex.adaptive ? '<span class="brain-protocol-tag">Adaptativo</span>' : ''
  const tier = exerciseTierTag(ex.id)
  const briefBtn = guide
    ? `<button type="button" class="brain-protocol-card__brief-link" onclick="event.stopPropagation(); showProtocolBrief('${ex.id}')">¿Qué mide?</button>`
    : ''
  return `<button type="button" onclick="startBrain('${ex.id}')" class="card game-card game-card--lab game-card--protocol text-left">
    <div class="brain-protocol-card">
      <div class="brain-protocol-card__head">
        <span class="brain-protocol-card__icon" aria-hidden="true">${ex.icon}</span>
        <div>
          <h3 class="brain-protocol-card__title">${ex.name}</h3>
          <p class="brain-protocol-card__paradigm">${ex.paradigm} · ${ex.duration || '~5 min'}</p>
        </div>
        <div class="brain-protocol-card__tags">${tier}${adaptive}</div>
      </div>
      ${guide ? `<p class="brain-protocol-card__purpose">${guide.purpose}</p>` : `<p class="brain-protocol-card__desc">${ex.desc}</p>`}
      ${guide ? `<p class="brain-protocol-card__measures">📊 ${guide.measures}</p>` : ''}
      ${ex.brainScan ? `<p class="brain-protocol-card__evidence">🧠 ${ex.brainScan}</p>` : guide?.brain ? `<p class="brain-protocol-card__evidence">🧠 ${guide.brain}</p>` : ''}
      ${rw ? `<p class="brain-protocol-card__life">→ ${rw}</p>` : ''}
      ${dom ? `<p class="brain-protocol-card__meta">${dom.name} · nivel ${getExerciseLevel(ex.id)}</p>` : ''}
      ${(() => {
        const last = getProtocolHistory(ex.id)[0]?.metrics?.accuracy
        return last != null ? `<p class="brain-protocol-card__history">Última sesión: ${last}%</p>` : ''
      })()}
      ${briefBtn}
    </div></button>`
}

function renderProtocolIntro(exId, startFn, extraHtml = '') {
  const ex = EXERCISES[exId]
  const guide = getExerciseGuide(exId)
  const dom = ex ? COGNITIVE_DOMAINS[ex.domain] : null
  if (!ex || !guide) {
    return brainWrapper(`<div class="text-center">
      <h3 class="font-display text-xl font-semibold mb-4">${ex?.name || 'Protocolo'}</h3>
      ${extraHtml}
      <button type="button" onclick="${startFn}" class="btn-primary mt-4">Iniciar</button>
    </div>`)
  }
  return brainWrapper(`<div class="brain-protocol-brief">
    <header class="brain-protocol-brief__head">
      <span class="brain-protocol-brief__icon" aria-hidden="true">${ex.icon}</span>
      <div>
        <h3 class="brain-protocol-brief__title">${ex.name}</h3>
        <p class="brain-protocol-brief__paradigm">${ex.paradigm} · ${dom?.name || ''}</p>
      </div>
    </header>
    <section class="brain-protocol-brief__block">
      <h4 class="brain-protocol-brief__label">¿Para qué sirve?</h4>
      <p class="brain-protocol-brief__text">${guide.purpose}</p>
    </section>
    <section class="brain-protocol-brief__block">
      <h4 class="brain-protocol-brief__label">En la vida real</h4>
      <p class="brain-protocol-brief__text">${guide.life || EXERCISE_REAL_WORLD[exId] || ''}</p>
    </section>
    <section class="brain-protocol-brief__block">
      <h4 class="brain-protocol-brief__label">Cómo hacerlo</h4>
      <ol class="brain-protocol-brief__steps">${guide.howTo.map(s => `<li>${esc(s)}</li>`).join('')}</ol>
    </section>
    <div class="brain-protocol-brief__meta">
      <span>🧠 ${guide.brain || ex.brainScan || dom?.region || ''}</span>
      <span>📊 ${guide.measures}</span>
      <span>⏱ ${ex.duration || '~5 min'}</span>
    </div>
    ${extraHtml}
    <button type="button" onclick="${startFn}" class="btn-primary w-full py-4 mt-4">Iniciar protocolo</button>
    ${hasSeenProtocolBrief(exId) ? '<p class="brain-protocol-brief__note">Ya conoces este protocolo — puedes iniciar directamente la próxima vez.</p>' : ''}
  </div>`)
}

function renderProtocolDebrief(exId, score, total, finishBtnHtml) {
  const guide = getExerciseGuide(exId)
  const pct = total > 0 ? Math.round((score / total) * 100) : 0
  const tip = typeof guide?.debrief === 'function'
    ? guide.debrief(pct)
    : (guide?.life || 'La consistencia 3×/semana importa más que una sola sesión.')
  return `<aside class="brain-protocol-debrief">
    <p class="brain-protocol-debrief__score">${score}/${total} · ${pct}%</p>
    <p class="brain-protocol-debrief__label">Qué significa</p>
    <p class="brain-protocol-debrief__tip">${esc(tip)}</p>
    ${finishBtnHtml}
  </aside>`
}

function patchSymbolsTimerDOM() {
  const timer = document.getElementById('symbols-timer')
  if (!timer || !brainState.symbols?.active) return false
  const s = brainState.symbols
  timer.textContent = `⏱ ${s.timeLeft}s · ${s.index + 1}/${s.total}`
  return true
}

function patchMathTimerDOM() {
  const timer = document.getElementById('math-timer')
  if (!timer || !brainState.math?.active) return false
  const m = brainState.math
  timer.textContent = `${m.timeLeft}s`
  const score = document.getElementById('math-score')
  if (score) score.textContent = `${m.score} ✓`
  return true
}

const BRIEF_FIRST_EXERCISES = new Set([
  'stroop', 'flanker', 'switching', 'logic', 'nback', 'dualnback', 'cpt', 'gonogo',
  'visnback', 'trail', 'wisconsin', 'ant',
])

function legacyRenderBrainExercise(id) {
  if (id === 'dualnback') return renderDualNBackGame()
  if (id === 'revspan') return renderRevSpanGame()
  if (id === 'pasat') return renderPasatGame()
  if (id === 'switching') return renderSwitchingGame()
  if (id === 'corsi') return renderCorsiGame()
  if (id === 'symbols') return renderSymbolsGame()
  if (id === 'logic') return renderLogicGame()
  if (id === 'math') return renderMathGame()
  if (id === 'memory') return renderMemoryGame()
  if (id === 'simon') return renderSimonGame()
  if (id === 'sequence') return renderSequenceGame()
  if (id === 'reaction') return renderReactionGame()
  if (id === 'anagram') return renderAnagramGame()
  if (id === 'oddout') return renderOddOutGame()
  return ''
}

function renderBrainExercise() {
  const id = brainState.exercise
  if (brainState.protocolBrief === id && getExerciseGuide(id)) {
    return renderProtocolIntro(id, 'clearProtocolBrief()')
  }
  if (!LAB_EXERCISE_IDS.includes(id)) {
    brainState.exercise = null
    return `<div class="page-shell page-wide"><div class="card text-center p-8">
      <p class="text-muted mb-4">Ejercicio no disponible en el laboratorio.</p>
      <button onclick="exitExercise()" class="btn-primary">Volver</button></div></div>`
  }
  if (hasProtocol(id)) {
    const html = renderExercise(id, legacyRenderBrainExercise)
    if (html) return html
  }
  return legacyRenderBrainExercise(id)
}

const BRAIN_TAB_EPHEMERAL_RESET = 'if(brainState.session){brainState.mode=\'hub\';brainState.session=null;}brainState.exercise=null;brainState.activeLesson=null;brainState.schoolFaculty=null;brainState.activePaper=null;'
const BRAIN_TAB_HASH = { home: '/gimnasia/inicio', learn: '/gimnasia/aprender', train: '/gimnasia/entrenar', body: '/gimnasia/cuerpo' }

function brainTabDefs() {
  return [
    { id: 'home', label: 'Inicio', icon: '🧠' },
    { id: 'learn', label: 'Aprender', icon: '📖' },
    { id: 'train', label: 'Entrenar', icon: '⚡' },
    { id: 'body', label: 'Cuerpo', icon: '🥗' },
  ]
}

function renderBrainTabsHtml() {
  const active = normalizeBrainView(brainState.brainView)
  return `<nav class="ds-tabs" role="tablist">
    ${brainTabDefs().map(t => {
      const on = active === t.id
      return `<button type="button" role="tab" aria-selected="${on}"
        class="ds-tab ${on ? 'is-active' : ''}"
        onclick="${BRAIN_TAB_EPHEMERAL_RESET}goBrainTab('${t.id}',{skipRender:true});navigate('${BRAIN_TAB_HASH[t.id]}')">
        <span class="ds-tab-icon" aria-hidden="true">${t.icon}</span>
        <span>${t.label}</span>
      </button>`
    }).join('')}
  </nav>`
}

function brainHubShellClass() {
  const view = normalizeBrainView(brainState.brainView)
  const parts = ['page-shell', 'page-wide', 'page-brain', 'page-brain-neural']
  if (view === 'learn') parts.push('page-school')
  if (view === 'train') parts.push('brain-lab')
  return parts.join(' ')
}

function brainHubPageClass() {
  return 'ds-page ds-page--full brain-neural-campus brain-neural-page'
}

function renderLearnHub() {
  const stats = getSchoolStats()
  const hero = renderNeuralHero({
    kicker: 'Aprender',
    title: 'Escuela',
    sub: 'Currículo de 12 semanas · lecciones verificadas · biblioteca y casos.',
    stats: [
      { val: `${stats.percent}%`, lbl: 'progreso' },
      { val: stats.done, lbl: 'leídas' },
      { val: `${stats.week}/12`, lbl: 'semana' },
    ],
  })
  if (brainState.activePaper) {
    const paper = getPaper(brainState.activePaper)
    return paper
      ? hero + wrapSchoolPage(renderPaperDetail(paper, brainState.paperMeta), 'library', { stats, showHeader: false })
      : hero
  }
  return hero + renderSchoolHub(brainState.schoolFaculty, brainState.schoolSection, {
    pubmed: brainState.pubmed,
    libraryFilter: brainState.libraryFilter,
    catalogFilter: brainState.catalogFilter,
    showHeader: false,
  })
}

function renderTrainHub() {
  const stats = getProgramStats()
  const todaySession = getTodaysSession()
  const diff = brainState.difficulty
  const d = DIFFICULTIES[diff]
  const section = brainState.trainSection === 'lab' ? 'lab' : 'program'
  const tabs = subTabBar(
    [{ id: 'program', label: 'Programa', icon: '📋' }, { id: 'lab', label: 'Laboratorio', icon: '🔬' }],
    section,
    'brainState.trainSection',
    `navigate('/gimnasia/'+(brainState.trainSection==='lab'?'laboratorio':'programa'));`,
  )
  const hero = renderNeuralHero({
    kicker: 'Entrenar',
    title: section === 'lab' ? 'Laboratorio' : 'Programa',
    sub: section === 'lab'
      ? 'Protocolos clínicos con explicación: qué entrenan, qué mide cada uno y cómo aplicarlo en la vida real.'
      : 'Sesión guiada de 6 paradigmas · ~20 min · evidencia en función ejecutiva (no juegos casuales).',
    stats: section === 'lab'
      ? [{ val: getLabExercises().length, lbl: 'ejercicios' }, { val: `${d.icon} ${d.label}`, lbl: 'dificultad' }]
      : [
        { val: stats.doneToday ? '✓' : '○', lbl: 'hoy' },
        { val: `${stats.weekSessions}/${stats.weekTarget}`, lbl: 'semana' },
      ],
  })
  if (section === 'lab') {
    const labTab = brainState.labTab === 'free' ? 'free' : 'clinical'
    const labSubTabs = subTabBar(
      [
        { id: 'clinical', label: 'Laboratorio Clínico', icon: '🔬' },
        { id: 'free', label: 'Entrenamiento Libre', icon: '🎯' },
      ],
      labTab,
      'brainState.labTab',
      'render();',
    )
    const groups = labTab === 'free'
      ? LAB_EXERCISE_GROUPS.filter(g => g.id === 'casual')
      : LAB_EXERCISE_GROUPS.filter(g => g.id !== 'casual')
    const labSections = groups.map(g => {
      const items = g.ids.map(id => EXERCISES[id]).filter(Boolean)
      const badge = labTab === 'clinical'
        ? '<span class="brain-lab-section-badge brain-lab-section-badge--clinical">Métricas formales · d′ · coste de interferencia</span>'
        : '<span class="brain-lab-section-badge brain-lab-section-badge--free">Sin informe clínico · práctica flexible</span>'
      return `<div class="span-full brain-lab-group">
        <div class="brain-lab-group__head">
          <h3 class="ds-section-title">${g.label}</h3>
          ${badge}
        </div>
        <div class="brain-games-grid">${items.map(renderLabGameCard).join('')}</div>
      </div>`
    }).join('')
    const labIntro = labTab === 'clinical'
      ? '<p class="brain-lab-intro span-full">Protocolos con práctica guiada, bloque evaluado e informe con métricas clínicas.</p>'
      : '<p class="brain-lab-intro span-full">Ejercicios casuales para calentar o practicar sin rigor de laboratorio.</p>'
    return `${hero}${tabs}${labSubTabs}${labIntro}${difficultyPicker(diff, 'setBrainDiff')}${labSections}`
  }
  return `${hero}${tabs}
    <div class="brain-neural-card brain-neural-card--primary program-hero span-full">
      <p class="text-xs text-muted mb-2">📋 Sesión de hoy · ${todaySession.length} ejercicios · ~20 min</p>
      <div class="flex flex-wrap gap-2 mb-4">
        ${todaySession.map((ex, i) => `<span class="brain-session-chip">${i + 1}. ${ex.icon} ${ex.name}</span>`).join('')}
      </div>
      ${stats.doneToday
        ? `<p class="text-main font-medium mb-3">✅ Sesión completada hoy</p>
           <button onclick="startGuidedSession(true)" class="btn-secondary w-full">Repetir sesión</button>`
        : `<button onclick="startGuidedSession()" class="btn-primary w-full text-lg py-4">▶ Iniciar sesión guiada</button>`}
      <p class="text-xs text-muted mt-3 text-center">${stats.weekSessions}/${stats.weekTarget} sesiones esta semana</p>
    </div>
    <div class="brain-neural-card span-full">
      <p class="text-xs text-muted leading-relaxed">${PROGRAM_DISCLAIMER}</p>
    </div>`
}

function renderBrainHubBody() {
  brainState.brainView = normalizeBrainView(brainState.brainView)
  const view = brainState.brainView
  if (view === 'home') return renderInicioHub()
  if (view === 'learn') return renderLearnHub()
  if (view === 'train') return renderTrainHub()
  if (view === 'body') return renderBodyHub(brainState.bodySection)
  brainState.brainView = 'home'
  return renderInicioHub()
}

function renderBrainHubShell({ animate = true } = {}) {
  const anim = animate && !document.getElementById('brain-gym-hub') ? 'animate-fade-in' : ''
  return `<div id="brain-gym-shell" class="${anim} ${brainHubShellClass()}">
    <div class="${brainHubPageClass()}" id="brain-gym-page">
      <div id="brain-gym-tabs-wrap" class="brain-neural-tabs">${renderBrainTabsHtml()}</div>
      <div id="brain-gym-hub" class="brain-neural-hub">${renderBrainHubBody()}</div>
    </div>
  </div>`
}

function isBrainHubMode() {
  return !brainState.exercise
    && !brainState.reviewFlow
    && !brainState.activeLesson
    && !(brainState.session?.phase === 'debrief')
    && !(brainState.session?.phase === 'intro' && !brainState.exercise)
}

export function patchGimnasiaHubUI() {
  if (!isBrainHubMode()) return false
  const shell = document.getElementById('brain-gym-shell')
  const tabsWrap = document.getElementById('brain-gym-tabs-wrap')
  const hub = document.getElementById('brain-gym-hub')
  const page = document.getElementById('brain-gym-page')
  if (!shell || !tabsWrap || !hub || !page) return false

  shell.className = brainHubShellClass()
  page.className = brainHubPageClass()
  tabsWrap.innerHTML = renderBrainTabsHtml()
  hub.innerHTML = renderBrainHubBody()
  syncBrainSynapseFx()
  return true
}

export function syncBrainSynapseFx() {
  if (!isBrainHubMode()) {
    unmountSynapseField()
    lastSynapseView = null
    return
  }
  const view = normalizeBrainView(brainState.brainView)
  if (view !== 'home') {
    unmountSynapseField()
    lastSynapseView = null
    return
  }
  const canvas = document.getElementById('brain-synapse-canvas')
  if (canvas && canvas === synapseCanvasEl && isSynapseFieldMounted('brain-synapse-canvas')) return
  unmountSynapseField('brain-synapse-canvas')
  synapseCanvasEl = canvas
  lastSynapseView = 'home'
  if (!canvas) return
  requestAnimationFrame(() => {
    mountSynapseField('brain-synapse-canvas', { regions: getBrainRegionProgress(), mode: 'theater' })
    synapseCanvasEl = document.getElementById('brain-synapse-canvas')
  })
}

function renderBrainGym() {
  if (brainState.reviewFlow) {
    return `<div class="animate-fade-in page-shell page-wide page-brain page-brain-neural page-school">
      <div class="ds-page ds-page--full">${renderReviewQuizFlow(brainState.reviewFlow)}</div>
    </div>`
  }
  if (brainState.session?.phase === 'debrief') return renderSessionDebrief()
  if (brainState.session?.phase === 'intro' && !brainState.exercise) return renderSessionIntro()
  if (brainState.exercise) return renderBrainExercise()

  if (normalizeBrainView(brainState.brainView) === 'learn' && brainState.activeLesson) {
    if (brainState.lessonFlow?.id === brainState.activeLesson) {
      return `<div class="animate-fade-in page-shell page-wide page-brain page-brain-neural">
        <div class="ds-page ds-page--full">${renderBrainTabsHtml()}${renderLessonPostFlow(brainState.lessonFlow)}</div>
      </div>`
    }
    const lesson = LESSONS.find(l => l.id === brainState.activeLesson)
    if (!lesson) {
      brainState.activeLesson = null
      brainState.lessonFlow = null
      navigate('/gimnasia/aprender')
      return renderBrainHubShell()
    }
    return renderLessonFull(lesson)
  }

  return renderBrainHubShell()
}

function renderSessionIntro() {
  const s = brainState.session
  const ex = s.exercises[s.current]
  const dom = ex.domainInfo
  const guide = getExerciseGuide(ex.id)
  return `<div class="animate-fade-in page-shell page-wide page-brain page-brain-neural">
    <div class="exercise-dashboard">
    <div class="exercise-side">
      <button onclick="cancelSession()" class="btn-ghost mb-4">← Cancelar</button>
      <p class="text-sm text-muted">Protocolo ${s.current + 1} de ${s.exercises.length}</p>
      ${s.current === 0 ? '<p class="brain-session-warmup">Calentamiento: 3 trials de práctica por protocolo antes del bloque evaluado.</p>' : ''}
    </div>
    <div class="card exercise-stage brain-protocol-brief brain-protocol-brief--session">
      <header class="brain-protocol-brief__head">
        <span class="brain-protocol-brief__icon">${ex.icon}</span>
        <div>
          <h2 class="brain-protocol-brief__title">${ex.name}</h2>
          <p class="brain-protocol-brief__paradigm">${ex.paradigm} · ${dom?.name || ''}</p>
        </div>
      </header>
      ${guide ? `<section class="brain-protocol-brief__block">
        <h4 class="brain-protocol-brief__label">¿Para qué sirve?</h4>
        <p class="brain-protocol-brief__text">${guide.purpose}</p>
      </section>
      <section class="brain-protocol-brief__block">
        <h4 class="brain-protocol-brief__label">En la vida real</h4>
        <p class="brain-protocol-brief__text">${guide.life || EXERCISE_REAL_WORLD[ex.id] || ''}</p>
      </section>
      <p class="brain-protocol-brief__meta">📊 ${guide.measures} · Nivel ${ex.level} · ${ex.duration}</p>` : `<p class="brain-protocol-brief__text">${ex.desc}</p>`}
      <button onclick="launchSessionExercise()" class="btn-primary w-full py-4 mt-4">Iniciar protocolo</button>
    </div>
    </div>
  </div>`
}

function renderSessionDebrief() {
  const s = brainState.session
  const avg = s.results.length
    ? Math.round(s.results.reduce((a, r) => a + r.accuracy, 0) / s.results.length * 100)
    : 0
  const debrief = getSessionDebrief(s.results)
  const analysis = analyzeSessionResults(s.results)
  return `<div class="animate-fade-in page-shell page-wide page-brain">
    <div class="session-debrief span-full">
      <header class="session-debrief-header text-center mb-6">
        <p class="text-5xl mb-3">🧠</p>
        <h2 class="font-display text-2xl font-bold text-main mb-1">Sesión completada</h2>
        <p class="text-muted">Precisión media ${avg}% · ${s.results.length} protocolos</p>
      </header>
      <div class="session-debrief-scores space-y-2 mb-6">
        ${s.results.map(r => `<div class="flex justify-between text-sm p-2 rounded-lg session-debrief-row">
          <span>${esc(r.icon || '')} ${esc(r.name || r.exerciseId)}</span>
          <span class="font-medium">${Math.round(r.accuracy * 100)}%</span>
        </div>`).join('')}
      </div>
      ${analysis.weakest ? `<aside class="session-debrief-analysis card-static mb-4">
        <p class="session-debrief-label">Análisis de sesión</p>
        <p class="session-debrief-intro">${esc(analysis.tip)}</p>
        ${analysis.strongest ? `<p class="text-sm text-muted mt-2">Más fuerte: ${esc(analysis.strongest.name)} (${Math.round(analysis.strongest.accuracy * 100)}%)</p>` : ''}
      </aside>` : ''}
      <aside class="session-debrief-prompts card-static">
        <p class="session-debrief-label">Debrief · 30 segundos</p>
        <p class="session-debrief-intro">${debrief.intro}</p>
        <ul class="session-debrief-list">
          ${debrief.prompts.map(p => `<li>${esc(p)}</li>`).join('')}
        </ul>
        <textarea id="session-debrief-text" class="input-field min-h-24 resize-none mt-3" placeholder="Opcional: una nota breve sobre la sesión…"></textarea>
      </aside>
      <button type="button" onclick="submitSessionDebrief(${avg})" class="btn-primary w-full py-4 mt-4">Guardar y recibir XP</button>
      <button type="button" onclick="finishGuidedSession(${avg})" class="btn-ghost w-full mt-2">Omitir reflexión</button>
    </div>
  </div>`
}

window.startGuidedSession = function(repeat = false) {
  if (!repeat && isSessionDoneToday()) {
    showToast('Ya completaste la sesión de hoy', 0, 'mental')
    return
  }
  brainState.mode = 'session'
  brainState.session = {
    exercises: getTodaysSession(),
    current: 0,
    results: [],
    phase: 'intro',
  }
  brainState.brainView = 'train'
  brainState.trainSection = 'program'
  render()
}

window.cancelSession = function() {
  clearBrainTimers()
  brainState.mode = 'hub'
  brainState.session = null
  brainState.exercise = null
  goTrain('program')
  if (typeof window.navigate === 'function') window.navigate('/gimnasia/programa')
}

window.launchSessionExercise = function() {
  const s = brainState.session
  const ex = s.exercises[s.current]
  s.phase = 'playing'
  startBrain(ex.id, true)
}

window.submitSessionDebrief = function(avgPct) {
  const note = document.getElementById('session-debrief-text')?.value?.trim()
  if (note) setItem('lastSessionDebrief', { note, at: getToday(), avg: avgPct })
  window.finishGuidedSession(avgPct)
}

window.finishGuidedSession = function(avgPct) {
  const bonus = Math.floor(avgPct * 1.5)
  awardXp('mental', 40 + bonus, 'Sesión cerebral completada')
  processPlanAwards(checkPlanTask('brain'))
  recordActivity('brain')
  updateStats({
    brainSessions: getStats().brainSessions + 1,
    challengesWon: getStats().challengesWon + 1,
  })
  brainState.mode = 'hub'
  brainState.session = null
  brainState.exercise = null
  goTrain('program')
  navigate('/gimnasia/programa')
}

function endExerciseBlock(score, total, exerciseId) {
  const accuracy = total > 0 ? score / total : 0
  if (exerciseId) updateExerciseLevel(exerciseId, accuracy)
  clearBrainTimers()
  if (brainState.mode === 'session' && brainState.session) {
    const exId = exerciseId || brainState.exercise
    const ex = EXERCISES[exId]
    brainState.session.results.push({
      exerciseId: exId, accuracy, score, total,
      domain: ex?.domain, name: ex?.name, icon: ex?.icon,
    })
    brainState.exercise = null
    if (brainState.session.current + 1 < brainState.session.exercises.length) {
      brainState.session.current++
      brainState.session.phase = 'intro'
    } else {
      completeSession(brainState.session.results)
      brainState.session.phase = 'debrief'
    }
    render()
    return
  }
  finishBrain(Math.round(accuracy * 100))
}

window.setBrainDiff = (d) => { brainState.difficulty = guardDifficulty(d); render() }

function startBrain(id, fromSession = false) {
  clearBrainTimers()
  if (!LAB_EXERCISE_IDS.includes(id)) {
    showToast('Ejercicio no disponible', 0, 'mental')
    return
  }
  const diff = brainState.difficulty
  const level = fromSession ? getExerciseLevel(id) : 1
  brainState.exercise = id
  resetGameMeta()
  const inten = getIntensity(diff)
  if (id === 'dualnback') brainState.dualnback = initDualNBack(level, brainTrialCount(24, diff), diff)
  if (id === 'cpt') {
    brainState.cpt = initCPT(brainTrialCount(70, diff), diff)
    ensureClinicalLab().prepareClinicalState(brainState.cpt)
  }
  if (id === 'revspan') brainState.revspan = initRevSpan(3 + (diff === 'dificil' ? 1 : 0) + (diff === 'experto' ? 1 : 0), diff)
  if (id === 'pasat') brainState.pasat = initPasat(brainTrialCount(35, diff), diff)
  if (id === 'nback') {
    brainState.nback = initNBack(level, brainTrialCount(16, diff), diff)
    ensureClinicalLab().prepareClinicalState(brainState.nback)
  }
  if (id === 'visnback') {
    brainState.visnback = initVisNBack(level, brainTrialCount(16, diff), diff)
    ensureClinicalLab().prepareClinicalState(brainState.visnback)
  }
  if (id === 'trail') {
    const variant = diff === 'experto' || diff === 'dificil' ? 'B' : 'A'
    brainState.trail = initTrailMaking(variant, diff)
    ensureClinicalLab().prepareClinicalState(brainState.trail)
  }
  if (id === 'wisconsin') {
    brainState.wisconsin = initWisconsin(brainTrialCount(20, diff), diff)
    ensureClinicalLab().prepareClinicalState(brainState.wisconsin)
  }
  if (id === 'ant') {
    brainState.ant = initANT(brainTrialCount(30, diff), diff)
    ensureClinicalLab().prepareClinicalState(brainState.ant)
  }
  if (id === 'stroop') {
    brainState.stroop = initStroop(brainTrialCount(14, diff), diff)
    brainState.stroop.practiceTrials = initStroop(PRACTICE_TRIALS, diff).trials
    ensureClinicalLab().prepareClinicalState(brainState.stroop)
  }
  if (id === 'flanker') {
    brainState.flanker = initFlanker(brainTrialCount(16, diff), diff)
    brainState.flanker.practiceTrials = initFlanker(PRACTICE_TRIALS, diff).trials
    ensureClinicalLab().prepareClinicalState(brainState.flanker)
  }
  if (id === 'switching') brainState.switching = initSwitching(brainTrialCount(20, diff), diff)
  if (id === 'gonogo') {
    const g = initGoNoGo(brainTrialCount(24, diff), diff)
    g.fullTrials = g.trials
    g.practiceTrials = initGoNoGo(PRACTICE_TRIALS, diff).trials
    brainState.gonogo = g
    ensureClinicalLab().prepareClinicalState(brainState.gonogo)
  }
  if (id === 'corsi') brainState.corsi = initCorsi(level + (diff === 'experto' ? 2 : diff === 'dificil' ? 1 : 0), diff)
  if (id === 'symbols') brainState.symbols = initSymbols(brainTrialCount(18, diff), diff === 'experto' ? 28 : diff === 'dificil' ? 38 : diff === 'facil' ? 55 : 45)
  if (id === 'logic') brainState.logic = { puzzles: getLogicPuzzles(diff, brainTrialCount(5, diff)), index: 0, score: 0, selected: null, finished: false, difficulty: diff, timeLimit: inten.timeLimit }
  if (id === 'math') brainState.math = { active: false, score: 0, timeLeft: diff === 'experto' ? 75 : diff === 'dificil' ? 60 : diff === 'facil' ? 45 : 50, difficulty: diff, problem: null, answer: '', feedback: null }
  if (id === 'memory') brainState.memory = { phase: 'ready', level: 1, score: 0, config: getMemoryConfig(diff), sequence: [], input: [], highlight: null }
  if (id === 'simon') brainState.simon = { phase: 'ready', level: 1, score: 0, sequence: [], input: [], showing: -1, config: getSimonConfig(diff) }
  if (id === 'sequence') {
    brainState.sequence = {
      round: 0, total: brainTrialCount(5, diff), score: 0, difficulty: diff,
      current: pickSequence(diff), finished: false, timeLimit: inten.timeLimit,
    }
  }
  if (id === 'reaction') {
    brainState.reaction = initReaction(brainTrialCount(7, diff))
    brainState.reaction.difficulty = diff
  }
  if (id === 'anagram') {
    brainState.anagram = initAnagram(getAnagrams(brainTrialCount(6, diff)))
    brainState.anagram.timeLimit = inten.timeLimit
  }
  if (id === 'oddout') {
    const groups = [
      ...(WORD_GROUPS.facil || []),
      ...(diff !== 'facil' ? WORD_GROUPS.medio || [] : []),
      ...(diff === 'dificil' || diff === 'experto' ? WORD_GROUPS.dificil || [] : []),
    ]
    brainState.oddout = initOddOut(groups, brainTrialCount(7, diff))
    brainState.oddout.timeLimit = inten.timeLimit
  }
  brainState.protocolBrief = (BRIEF_FIRST_EXERCISES.has(id) && !hasSeenProtocolBrief(id)) ? id : null
  setActiveProtocol(hasProtocol(id) ? id : null)
  if (document.getElementById('brain-exercise-stage')) render(true)
  else if (typeof window.render === 'function') window.render(true)
  if (!brainState.protocolBrief && TIMED_TRIAL_HANDLERS[id]) queueArmTrial()
}

window.showProtocolBrief = function(id) {
  if (!LAB_EXERCISE_IDS.includes(id)) return
  startBrain(id)
  brainState.protocolBrief = id
  render(true)
}

window.clearProtocolBrief = function() {
  const id = brainState.exercise
  if (!id) return
  if (BRIEF_FIRST_EXERCISES.has(id)) markProtocolBriefSeen(id)
  brainState.protocolBrief = null
  const stateKey = id === 'dualnback' ? 'dualnback' : id
  const s = brainState[stateKey]
  if (s && CLINICAL_PROTOCOLS.has(id)) {
    try { ensureClinicalLab().prepareClinicalState(s) } catch (err) {
      console.error('[brain-lab] clinical init', err)
    }
  }
  const stage = document.getElementById('brain-exercise-stage')
  if (stage) flushExerciseRender()
  else if (typeof window.render === 'function') window.render(true)
  if (TIMED_TRIAL_HANDLERS[id]) queueArmTrial()
}

function finishBrain(score = 0) {
  const diff = brainState.difficulty
  const game = brainState.exercise
  clearBrainTimers()
  recordActivity('brain')
  updateStats({
    brainSessions: getStats().brainSessions + 1,
    challengesWon: getStats().challengesWon + 1,
  })
  if (score > 0) setRecord(game, diff, score)
  const mult = brainState.gameMeta?.multiplier || 1
  const xp = Math.floor((DIFFICULTIES[diff]?.xp || 30) * (1 + score / 100) * mult)
  awardXp('mental', xp, 'Ejercicio mental')
  processPlanAwards(checkPlanTask('brain'))
  brainState.exercise = null
  render()
}

// --- Paradigmas neurociencia ---
function dualNbackGrid(pos, activePos) {
  return `<div class="brain-dual-grid" role="presentation">
    ${Array.from({ length: 9 }, (_, i) =>
      `<span class="brain-dual-cell ${i === activePos ? 'is-active' : ''}"></span>`
    ).join('')}
  </div>`
}

function renderDualNBackGame() {
  const s = brainState.dualnback
  if (s.finished) {
    const pct = s.trials ? Math.round(s.score / (s.trials * 2) * 100) : 0
    return brainWrapper(`<div class="text-center">
      <p class="font-display text-xl font-semibold mb-2">Dual ${s.n}-Back</p>
      <p class="text-muted mb-2">Letra ${s.letterScore}/${s.trials} · Posición ${s.posScore}/${s.trials}</p>
      ${renderProtocolDebrief('dualnback', s.score, s.trials * 2 || 1, brainFinishBtn(s.score, s.trials * 2 || 1, 'dualnback'))}</div>`)
  }
  if (s.phase === 'ready') {
    return renderProtocolIntro('dualnback', 'dualNbackStart()',
      `<p class="brain-protocol-brief__note">Nivel ${s.n} · estímulo cada ~${Math.round(s.paceMs / 100) / 10}s</p>`)
  }
  const t = s.stream[s.index]
  return brainWrapper(`<div class="text-center brain-arena">
    ${brainHud(s.index + 1, s.total + s.n, `Dual ${s.n}-Back`)}
    ${dualNbackGrid(t.pos, t.pos)}
    <p class="brain-stimulus brain-stimulus--letter">${t.letter}</p>
    <p class="brain-hint">Marca antes de que avance el estímulo</p>
    <div class="brain-action-row brain-action-row--dual">
      <button type="button" onclick="dualNbackToggle('letter')" class="btn-secondary flex-1 ${s.pressedLetter ? 'is-lit' : ''}">Letra</button>
      <button type="button" onclick="dualNbackToggle('pos')" class="btn-secondary flex-1 ${s.pressedPos ? 'is-lit' : ''}">Posición</button>
    </div>
    ${s.feedback ? `<p class="brain-feedback brain-feedback--${s.feedback === 'ok' ? 'ok' : 'bad'}">${s.feedback === 'ok' ? '✓' : '✗'}</p>` : ''}
  </div>`, { arena: true })
}

function dualNbackScheduleTick() {
  const s = brainState.dualnback
  if (s.phase !== 'play' || s.finished) return
  brainTimers.push(setTimeout(() => {
    if (s.phase === 'play' && !s.responded && brainState.exercise === 'dualnback') dualNbackCommit()
  }, s.paceMs))
}

window.dualNbackStart = function() {
  const s = brainState.dualnback
  s.phase = 'play'; s.index = 0; s.pressedLetter = false; s.pressedPos = false
  render()
  dualNbackScheduleTick()
}

window.dualNbackToggle = function(kind) {
  const s = brainState.dualnback
  if (s.phase !== 'play' || s.responded) return
  if (kind === 'letter') s.pressedLetter = !s.pressedLetter
  else s.pressedPos = !s.pressedPos
  render()
}

function dualNbackCommit() {
  const s = brainState.dualnback
  if (s.phase !== 'play' || s.responded) return
  const n = s.n
  const letterMatch = s.index >= n && s.stream[s.index].letter === s.stream[s.index - n].letter
  const posMatch = s.index >= n && s.stream[s.index].pos === s.stream[s.index - n].pos
  const letterOk = s.pressedLetter === letterMatch
  const posOk = s.pressedPos === posMatch
  if (letterOk) { s.letterScore++; s.score++ }
  if (posOk) { s.posScore++; s.score++ }
  const ok = letterOk && posOk
  markTrial(ok)
  s.feedback = ok ? 'ok' : 'bad'
  if (ok) playTone(523); else playTone(200)
  s.trials++; s.responded = true
  render()
  brainTimers.push(setTimeout(() => {
    s.feedback = null; s.responded = false
    s.pressedLetter = false; s.pressedPos = false
    s.index++
    if (s.index >= s.total + n) { s.finished = true; render(); return }
    render()
    dualNbackScheduleTick()
  }, ok ? 260 : 400))
}

function renderRevSpanGame() {
  const s = brainState.revspan
  if (s.finished) {
    return brainWrapper(`<div class="text-center">
      <p class="font-display text-xl font-semibold mb-2">Span inverso</p>
      <p class="text-muted mb-2">${s.score} secuencias · techo ${s.length} dígitos</p>
      ${renderProtocolDebrief('revspan', s.score, s.maxRounds || 1, brainFinishBtn(s.score, s.maxRounds || 1, 'revspan'))}</div>`)
  }
  if (s.phase === 'ready') {
    return renderProtocolIntro('revspan', 'revSpanStart()',
      `<p class="brain-protocol-brief__note">Empiezas con ${s.length} dígitos · escala hasta ${s.maxLen}</p>`)
  }
  if (s.phase === 'showing') {
    const digit = s.sequence[s.showIdx]
    return brainWrapper(`<div class="text-center brain-arena">
      ${brainHud(s.round + 1, s.maxRounds, 'Span inverso')}
      <p class="brain-hint" id="revspan-hint">Longitud ${s.length} · memoriza</p>
      <p class="brain-stimulus brain-stimulus--digit" id="revspan-digit">${digit}</p>
    </div>`, { arena: true })
  }
  return brainWrapper(`<div class="text-center brain-arena">
    ${brainHud(s.round + 1, s.maxRounds, 'Span inverso')}
    <p class="brain-hint">Escribe los ${s.length} dígitos al revés</p>
    <form onsubmit="revSpanSubmit(event)" class="brain-revspan-form">
      <input type="text" inputmode="numeric" pattern="[0-9]*" maxlength="${s.length}" id="revspan-input"
        class="input-field text-center text-3xl tracking-widest" autocomplete="off" autofocus>
      <button type="submit" class="btn-primary w-full mt-4">Confirmar</button>
    </form>
    ${s.feedback === 'bad' ? '<p class="text-red-400 mt-2">Secuencia incorrecta</p>' : ''}
  </div>`, { arena: true })
}

window.revSpanStart = function() {
  const s = brainState.revspan
  s.phase = 'showing'; s.round = 0; s.score = 0
  revSpanNextRound()
}

function revSpanNextRound() {
  const s = brainState.revspan
  s.sequence = revSpanGenerate(s.length)
  s.showIdx = 0; s.phase = 'showing'; s.feedback = null
  render()
  revSpanShowDigit()
}

function patchRevSpanUI() {
  const s = brainState.revspan
  if (!s || s.phase !== 'showing') return false
  const el = document.getElementById('revspan-digit')
  if (!el) return false
  el.textContent = s.sequence[s.showIdx]
  const hint = document.getElementById('revspan-hint')
  if (hint) hint.textContent = `Longitud ${s.length} · memoriza`
  syncBrainLabChrome()
  return true
}

function revSpanShowDigit() {
  const s = brainState.revspan
  const speed = s.difficulty === 'experto' ? 700 : s.difficulty === 'dificil' ? 850 : 1000
  brainDelay(() => {
    if (brainState.exercise !== 'revspan') return
    s.showIdx++
    if (s.showIdx < s.sequence.length) {
      if (!patchRevSpanUI()) render()
      revSpanShowDigit()
    } else {
      s.phase = 'input'
      render()
    }
  }, speed)
}

window.revSpanSubmit = function(e) {
  e.preventDefault()
  const s = brainState.revspan
  const val = document.getElementById('revspan-input')?.value?.trim() || ''
  const expected = [...s.sequence].reverse().join('')
  if (val === expected) {
    s.score++; s.round++
    playTone(523)
    if (s.round >= s.maxRounds || s.length >= s.maxLen) { s.finished = true; render(); return }
    s.length++
    revSpanNextRound()
  } else {
    s.feedback = 'bad'
    playTone(200)
    s.finished = true
    render()
  }
}

function renderPasatGame() {
  const s = brainState.pasat
  if (s.finished) {
    return brainWrapper(`<div class="text-center">
      <p class="font-display text-xl font-semibold mb-2">PASAT</p>
      ${renderProtocolDebrief('pasat', s.score, s.total - 1 || 1, brainFinishBtn(s.score, s.total - 1 || 1, 'pasat'))}</div>`)
  }
  if (s.phase === 'ready') {
    return renderProtocolIntro('pasat', 'pasatStart()',
      `<p class="brain-protocol-brief__note">Ritmo: ~${Math.round(s.paceMs / 100) / 10}s por dígito · ${s.total - 1} sumas</p>`)
  }
  const cur = s.digits[s.index]
  const prev = s.digits[s.index - 1]
  const target = cur + prev
  return brainWrapper(`<div class="text-center brain-arena">
    ${brainHud(s.index, s.total, 'PASAT')}
    <p class="brain-hint">Suma: dígito actual + anterior</p>
    <p class="brain-pasat-digits"><span>${prev}</span> + <span class="is-current">${cur}</span> = ?</p>
    <form onsubmit="pasatSubmit(event, ${target})">
      <input type="number" id="pasat-answer" class="input-field text-center text-2xl" autocomplete="off" autofocus>
      <button type="submit" class="btn-primary w-full mt-4">Enviar</button>
    </form>
    ${s.feedback === 'bad' ? '<p class="text-red-400 mt-2">Incorrecto</p>' : ''}
  </div>`, { arena: true })
}

function speakPasatDigit(n) {
  playTone(440 + n * 30, 0.08)
  if (typeof speechSynthesis !== 'undefined') {
    speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(String(n))
    u.lang = 'es-ES'
    u.rate = 1.05
    speechSynthesis.speak(u)
  }
}

window.pasatStart = function() {
  const s = brainState.pasat
  s.phase = 'play'; s.index = 1; s.misses = 0; s.answeredThisTrial = false
  speakPasatDigit(s.digits[s.index])
  render()
  pasatScheduleTick()
}

function pasatScheduleTick() {
  const s = brainState.pasat
  if (s.phase !== 'play' || s.finished) return
  brainTimers.push(setTimeout(() => {
    if (brainState.exercise !== 'pasat' || s.phase !== 'play') return
    if (!s.answeredThisTrial) {
      s.misses = (s.misses || 0) + 1
      s.feedback = 'bad'
    }
    s.answeredThisTrial = false
    s.index++
    if (s.index >= s.digits.length) { s.finished = true; render(); return }
    speakPasatDigit(s.digits[s.index])
    render()
    pasatScheduleTick()
  }, s.paceMs))
}

window.pasatSubmit = function(e, target) {
  e.preventDefault()
  const s = brainState.pasat
  if (s.answeredThisTrial) return
  const val = parseInt(document.getElementById('pasat-answer')?.value, 10)
  s.answeredThisTrial = true
  if (val === target) { s.score++; s.feedback = null; playTone(523) }
  else { s.feedback = 'bad'; playTone(200) }
  const pasatInput = document.getElementById('pasat-answer')
  if (pasatInput) pasatInput.value = ''
  render()
}

function renderSwitchingGame() {
  const s = brainState.switching
  if (s.finished) return brainWrapper(`<div class="text-center">
    <p class="font-semibold mb-2">Task switching completado</p>
    ${renderProtocolDebrief('switching', s.score, s.total, brainFinishBtn(s.score, s.total, 'switching'))}</div>`)
  const t = s.trials[s.index]
  const ruleLabel = t.rule === 'parity' ? '¿Es PAR o IMPAR?' : '¿Es mayor o menor que 5?'
  return brainWrapper(`<div class="text-center brain-arena" id="brain-switch-root">
    ${brainHud(s.index + 1, s.total, 'Cambio de regla')}
    <p class="brain-switch-badge badge-diff mb-4">${ruleLabel}</p>
    <p class="brain-switch-num font-display text-5xl font-bold text-main mb-8">${t.num}</p>
    <div id="brain-switch-actions" class="flex gap-3">
      ${t.rule === 'parity'
        ? `<button type="button" onclick="switchAnswer('even')" class="btn-secondary flex-1">Par</button><button type="button" onclick="switchAnswer('odd')" class="btn-secondary flex-1">Impar</button>`
        : `<button type="button" onclick="switchAnswer('low')" class="btn-secondary flex-1">≤ 5</button><button type="button" onclick="switchAnswer('high')" class="btn-secondary flex-1">&gt; 5</button>`}
    </div>
  </div>`, { arena: true })
}

window.switchAnswer = function(ans) {
  if (brainState._trialBusy) return
  clearTrialDeadline()
  const s = brainState.switching
  if (s.finished) return
  const t = s.trials[s.index]
  if (!t) return
  const ok = ans !== '__timeout__' && getSwitchAnswer(t, ans)
  if (ok) { s.score++; playTone(523) } else playTone(200)
  markTrial(ok)
  brainState.trialStart = null
  advanceTimedTrial(patchSwitchingUI, () => {
    s.index++
    if (s.index >= s.total) s.finished = true
    else queueArmTrial()
  })
}

function renderCorsiGame() {
  const c = brainState.corsi
  if (c.finished) return brainWrapper(`<div class="text-center">
    <p class="font-semibold mb-2">Corsi · span ${Math.max(c.level - 1, 1)}</p>
    ${renderProtocolDebrief('corsi', c.score, c.maxRounds, brainFinishBtn(c.score, c.maxRounds, 'corsi'))}</div>`)
  if (c.phase === 'ready') return renderProtocolIntro('corsi', 'corsiStart()',
    `<p class="brain-protocol-brief__note">Empiezas con secuencias de ${c.level} bloques</p>`)
  return brainWrapper(`<div class="brain-game-panel text-center">
    <p id="corsi-label" class="brain-game-label">Nivel ${c.level} · Ronda ${c.rounds + 1}/${c.maxRounds}</p>
    <div id="corsi-grid" class="brain-grid brain-grid--3" role="group" aria-label="Bloques Corsi">
      ${Array.from({ length: 9 }, (_, i) => `<button type="button" id="corsi-cell-${i}" onclick="corsiTap(${i})" ${c.phase !== 'input' ? 'disabled' : ''}
        class="brain-grid-cell corsi-cell brain-corsi-3d ${c.highlight === i ? 'is-lit' : ''}" aria-label="Bloque ${i + 1}"></button>`).join('')}
    </div>
    <p id="corsi-hint" class="brain-game-hint">${CORSI_HINTS[c.phase] || ''}</p>
  </div>`)
}

window.corsiStart = function() {
  const c = brainState.corsi
  c.sequence = corsiGenerateSequence(c.level)
  c.userInput = []; c.phase = 'showing'; c.highlight = -1
  let i = 0
  function show() {
    if (i < c.sequence.length) {
      const pace = Math.round(500 * getIntensity(c.difficulty || brainState.difficulty).pace)
      const gap = Math.round(300 * getIntensity(c.difficulty || brainState.difficulty).pace)
      c.highlight = c.sequence[i]
      if (!patchCorsiUI()) render()
      playTone(400 + i * 80, 0.12)
      brainTimers.push(setTimeout(() => {
        c.highlight = -1
        if (!patchCorsiUI()) render()
        i++
        brainTimers.push(setTimeout(show, gap))
      }, pace))
    } else { c.phase = 'input'; render() }
  }
  brainTimers.push(setTimeout(show, 400))
  render()
}

window.corsiTap = function(pos) {
  const c = brainState.corsi
  if (c.phase !== 'input') return
  c.userInput.push(pos); playTone(400, 0.08)
  if (pos !== c.sequence[c.userInput.length - 1]) {
    c.finished = true; render(); return
  }
  if (c.userInput.length === c.sequence.length) {
    c.score++; c.rounds++
    if (c.rounds >= c.maxRounds) { c.finished = true }
    else { c.level++; c.phase = 'success'; render(); brainTimers.push(setTimeout(() => window.corsiStart(), 900)) }
  }
  render()
}

function renderSymbolsGame() {
  const s = brainState.symbols
  if (s.finished) return brainWrapper(`<div class="text-center">
    ${renderProtocolDebrief('symbols', s.score, s.total, brainFinishBtn(s.score, s.total, 'symbols'))}</div>`)
  if (!s.active) return renderProtocolIntro('symbols', 'symbolsStart()',
    `<div class="brain-protocol-brief__table flex justify-center gap-3 mb-2 text-sm">
      ${s.map.map(m => `<span>${m.sym} = ${m.digit}</span>`).join('')}
    </div>
    <p class="brain-protocol-brief__note text-center">Tiempo: ${s.timeLeft}s</p>`)
  const t = s.trials[s.index]
  return brainWrapper(`<div class="text-center">
    <p id="symbols-timer" class="text-sm text-muted mb-2">⏱ ${s.timeLeft}s · ${s.index + 1}/${s.total}</p>
    <div class="flex justify-center gap-3 mb-4 text-xs">${s.map.map(m => `<span>${m.sym}=${m.digit}</span>`).join('')}</div>
    <p class="font-display text-6xl text-main mb-6">${t.sym}</p>
    <div class="grid grid-cols-3 gap-2">
      ${s.map.map(m => `<button onclick="symbolAnswer(${m.digit})" class="p-4 rounded-xl font-bold text-lg" style="background:var(--secondary-bg)">${m.digit}</button>`).join('')}
    </div></div>`)
}

window.symbolsStart = function() {
  const s = brainState.symbols
  s.active = true
  const tick = setInterval(() => {
    s.timeLeft--
    if (s.timeLeft <= 0) { clearInterval(tick); s.finished = true; render() }
    else patchSymbolsTimerDOM()
  }, 1000)
  brainTimers.push(tick)
  render()
}

window.symbolAnswer = function(digit) {
  const s = brainState.symbols
  if (!s.active || s.finished) return
  const t = s.trials[s.index]
  if (digit === t.correct) { s.score++; playTone(523) } else playTone(200)
  s.index++
  if (s.index >= s.total) s.finished = true
  render()
}

const CORSI_HINTS = { showing: 'Observa la secuencia', input: 'Repite la secuencia', success: '✓ Correcto' }

function patchCorsiUI() {
  const c = brainState.corsi
  if (!c || c.finished || c.phase === 'ready') return false
  const grid = document.getElementById('corsi-grid')
  if (!grid) return false
  for (let i = 0; i < 9; i++) {
    const cell = document.getElementById(`corsi-cell-${i}`)
    if (!cell) return false
    cell.classList.toggle('is-lit', c.highlight === i)
    cell.disabled = c.phase !== 'input'
  }
  const hint = document.getElementById('corsi-hint')
  if (hint) hint.textContent = CORSI_HINTS[c.phase] || ''
  const label = document.getElementById('corsi-label')
  if (label) label.textContent = `Nivel ${c.level} · Ronda ${c.rounds + 1}/${c.maxRounds}`
  return true
}

function patchMemoryUI() {
  const m = brainState.memory
  if (!m || m.phase === 'ready' || m.phase === 'failed') return false
  const grid = document.getElementById('memory-grid')
  if (!grid) return false
  const colors = COLORS.slice(0, m.config.colors)
  for (let i = 0; i < colors.length; i++) {
    const cell = document.getElementById(`memory-cell-${i}`)
    if (!cell) return false
    cell.classList.toggle('is-lit', m.highlight === i)
    cell.disabled = m.phase !== 'input'
  }
  const status = document.getElementById('memory-status')
  if (status) {
    const txt = { showing: 'Observa...', input: 'Tu turno', success: '¡Correcto!' }[m.phase] || ''
    status.textContent = `Nv. ${m.level} · ${m.score} pts · ${txt}`
  }
  return true
}

function patchSimonUI() {
  const s = brainState.simon
  if (!s || s.phase === 'ready' || s.phase === 'failed') return false
  if (s.phase === 'showing') {
    const display = document.getElementById('simon-display')
    if (!display) return false
    display.textContent = s.showing >= 0 ? String(s.sequence[s.showing]) : ''
    return true
  }
  const grid = document.getElementById('simon-grid')
  if (!grid) return false
  const label = document.getElementById('simon-label')
  if (label) label.textContent = `Nivel ${s.level}`
  return true
}

function patchSwitchingUI() {
  const s = brainState.switching
  if (!s || s.finished || brainState.protocolBrief === 'switching') return false
  const num = document.querySelector('.brain-switch-num')
  const badge = document.querySelector('.brain-switch-badge')
  const actions = document.getElementById('brain-switch-actions')
  if (!num || !badge || !actions) return false
  const t = s.trials[s.index]
  if (!t) return false
  num.textContent = String(t.num)
  const ruleLabel = t.rule === 'parity' ? '¿Es PAR o IMPAR?' : '¿Es mayor o menor que 5?'
  badge.textContent = ruleLabel
  actions.innerHTML = t.rule === 'parity'
    ? `<button type="button" onclick="switchAnswer('even')" class="btn-secondary flex-1">Par</button><button type="button" onclick="switchAnswer('odd')" class="btn-secondary flex-1">Impar</button>`
    : `<button type="button" onclick="switchAnswer('low')" class="btn-secondary flex-1">≤ 5</button><button type="button" onclick="switchAnswer('high')" class="btn-secondary flex-1">&gt; 5</button>`
  const fill = document.querySelector('.brain-lab-metrics__fill')
  const val = document.querySelector('.brain-lab-metrics__value')
  if (fill) fill.style.width = `${Math.round(((s.index + 1) / s.total) * 100)}%`
  if (val) val.textContent = `${s.index + 1}/${s.total}`
  syncBrainLabChrome()
  return true
}

function patchBrainExerciseUI() {
  const id = brainState.exercise
  if (!id) return false
  if (id === 'corsi') return patchCorsiUI()
  if (id === 'memory') return patchMemoryUI()
  if (id === 'simon') return patchSimonUI()
  if (id === 'stroop') return patchStroopUI()
  if (id === 'flanker') return patchFlankerUI()
  if (id === 'switching') return patchSwitchingUI()
  return false
}

function advanceTimedTrial(patchFn, onDone) {
  if (brainState._trialBusy) return
  brainState._trialBusy = true
  onDone()
  brainState._trialBusy = false
  if (!brainState.exercise) return
  const s = brainState[brainState.exercise]
  if (s?.finished) { render(true); return }
  if (patchFn && patchFn()) syncBrainLabChrome()
  else render(true)
}

function renderSequenceGame() {
  const s = brainState.sequence
  if (s.finished) return brainWrapper(`<div class="text-center">
    <p class="text-2xl mb-2">📐</p><p class="font-semibold mb-6">${s.score}/${s.total} correctos</p>
    ${brainFinishBtn(s.score, s.total, 'sequence', `Terminar (+${Math.floor(DIFFICULTIES[s.difficulty].xp * (s.score / s.total))} XP)`)}</div>`)
  if (!s.current) s.current = pickSequence(s.difficulty)
  return brainWrapper(`<div class="text-center brain-arena">
    ${brainHud(s.round + 1, s.total, 'Patrones')}
    <p class="brain-sequence-line">${s.current.seq.join(' · ')} <span class="brain-sequence-q">?</span></p>
    <p class="brain-hint">Detecta la regla</p>
    <div class="brain-choice-grid">
      ${s.current.opts.map(n => `<button type="button" onclick="seqAnswer(${n})" class="brain-choice-btn">${n}</button>`).join('')}
    </div></div>`, { arena: true })
}

window.seqAnswer = function(n) {
  clearTrialDeadline()
  const s = brainState.sequence
  const ok = n === s.current.ans
  if (ok) { s.score++; playTone(523) } else playTone(200)
  markTrial(ok)
  s.round++
  if (s.round >= s.total) s.finished = true
  else {
    s.current = pickSequence(s.difficulty)
    queueArmTrial()
  }
  render()
}

function reactionStartWait() {
  const s = brainState.reaction
  const diff = s.difficulty || brainState.difficulty
  s.phase = 'wait'
  s.delayMs = reactionDelayMs(diff)
  render()
  brainTimers.push(setTimeout(() => {
    if (brainState.exercise !== 'reaction' || s.finished) return
    s.phase = 'go'
    s.trialStart = Date.now()
    render()
    brainTimers.push(setTimeout(() => {
      if (s.phase !== 'go' || s.finished) return
      s.phase = 'miss'
      s.feedback = 'miss'
      markTrial(false)
      playTone(180)
      render()
      brainTimers.push(setTimeout(() => reactionNextTrial(), 900))
    }, reactionGoWindowMs(diff)))
  }, s.delayMs))
}

function reactionNextTrial() {
  const s = brainState.reaction
  s.feedback = null
  s.index++
  if (s.index >= s.total) { s.finished = true; render(); return }
  reactionStartWait()
}

function renderReactionGame() {
  const s = brainState.reaction
  if (s.finished) {
    const avg = s.rts.length ? Math.round(s.rts.reduce((a, b) => a + b, 0) / s.rts.length) : 0
    const best = s.rts.length ? Math.min(...s.rts) : 0
    return brainWrapper(`<div class="text-center brain-arena">
      <p class="brain-stat-big">⚡</p>
      <p class="font-semibold mb-2">Reflejos medidos</p>
      <div class="brain-stats-row">
        <div><span class="brain-stat-val">${s.score}</span><span class="brain-stat-lbl">puntos</span></div>
        <div><span class="brain-stat-val">${avg || '—'}</span><span class="brain-stat-lbl">ms prom.</span></div>
        <div><span class="brain-stat-val">${best || '—'}</span><span class="brain-stat-lbl">mejor</span></div>
      </div>
      <p class="text-xs text-muted mb-6">${s.falseStarts} falsas salidas</p>
      ${renderProtocolDebrief('reaction', s.score, s.total, brainFinishBtn(s.score, s.total, 'reaction'))}</div>`, { arena: true })
  }
  if (s.phase === 'intro') {
    return renderProtocolIntro('reaction', 'reactionBegin()')
  }
  const phaseClass = {
    wait: 'is-wait', go: 'is-go', early: 'is-early', hit: 'is-hit', miss: 'is-miss',
  }[s.phase] || 'is-wait'
  const msg = {
    wait: 'Espera…', go: '¡YA!', early: 'Muy pronto', hit: brainState.gameMeta.lastRt ? `${brainState.gameMeta.lastRt} ms` : '¡Bien!', miss: 'Tarde',
  }[s.feedback || s.phase] || 'Espera…'
  return brainWrapper(`<div class="text-center brain-arena">
    ${brainHud(s.index + 1, s.total, 'Reflejos')}
    <button type="button" onclick="reactionTap()" class="brain-reaction-pad ${phaseClass}">
      <span class="brain-reaction-msg">${msg}</span>
    </button>
    <p class="brain-hint mt-4">Toca en cuanto veas verde</p>
  </div>`, { arena: true })
}

window.reactionBegin = function() {
  reactionStartWait()
}

window.reactionTap = function() {
  const s = brainState.reaction
  if (s.finished) return
  if (s.phase === 'wait') {
    s.falseStarts++
    s.phase = 'early'
    s.feedback = 'early'
    markTrial(false)
    playTone(150)
    clearBrainTimers()
    brainTimers.push(setTimeout(() => reactionNextTrial(), 900))
    render()
    return
  }
  if (s.phase === 'go') {
    const rt = Date.now() - s.trialStart
    s.rts.push(rt)
    const pts = scoreReactionRt(rt, s.difficulty || brainState.difficulty)
    s.score += pts
    markTrial(pts > 0, rt)
    s.phase = 'hit'
    s.feedback = 'hit'
    if (pts > 0) { playTone(523) } else { playTone(280) }
    clearBrainTimers()
    brainTimers.push(setTimeout(() => reactionNextTrial(), 750))
    render()
  }
}

function renderAnagramGame() {
  const a = brainState.anagram
  if (a.finished) {
    return brainWrapper(`<div class="text-center">
      <p class="brain-stat-big">🔤</p>
      <p class="font-semibold mb-6">${a.score}/${a.total} anagramas · racha máx ${brainState.gameMeta.bestStreak}</p>
      ${brainFinishBtn(a.score, a.total, 'anagram')}</div>`)
  }
  const p = a.puzzles[a.index]
  const letters = p.scrambled.split('').map((ch, i) =>
    `<span class="brain-letter" style="--d:${i * 40}ms">${ch}</span>`).join('')
  return brainWrapper(`<div class="text-center brain-arena">
    ${brainHud(a.index + 1, a.total, 'Anagramas')}
    <div class="brain-scramble" aria-label="Letras mezcladas">${letters}</div>
    ${a.hintUsed ? `<p class="brain-hint">💡 ${esc(p.hint)}</p>` : `<button type="button" class="btn-ghost text-sm mb-2" onclick="anagramHint()">Ver pista</button>`}
    <div class="brain-choice-grid brain-choice-grid--2">
      ${a.choices.map((w, i) => `<button type="button" onclick="anagramPick(${i})" class="brain-choice-btn brain-choice-btn--word">${esc(w)}</button>`).join('')}
    </div>
    ${a.feedback ? `<p class="brain-feedback brain-feedback--${a.feedback}">${a.feedback === 'ok' ? '✓' : '✗'}</p>` : ''}
  </div>`, { arena: true })
}

window.anagramHint = function() {
  brainState.anagram.hintUsed = true
  render()
}

window.anagramPick = function(choiceIdx) {
  clearTrialDeadline()
  const a = brainState.anagram
  if (a.feedback) return
  const p = a.puzzles[a.index]
  const word = choiceIdx >= 0 ? a.choices[choiceIdx] : ''
  const ok = word === p.answer
  a.feedback = ok ? 'ok' : 'bad'
  if (ok) { a.score++; playTone(523) } else playTone(200)
  markTrial(ok)
  render()
  brainTimers.push(setTimeout(() => {
    a.feedback = null
    a.hintUsed = false
    a.index++
    if (a.index >= a.total) { a.finished = true }
    else {
      const next = a.puzzles[a.index]
      a.choices = buildAnagramChoices(next, a.puzzles)
      queueArmTrial()
    }
    render()
  }, ok ? 450 : 700))
}

function renderOddOutGame() {
  const o = brainState.oddout
  if (o.finished) {
    return brainWrapper(`<div class="text-center">
      <p class="brain-stat-big">🕵️</p>
      <p class="font-semibold mb-6">${o.score}/${o.total} intrusos detectados</p>
      ${brainFinishBtn(o.score, o.total, 'oddout')}</div>`)
  }
  const t = o.trials[o.index]
  return brainWrapper(`<div class="brain-arena">
    ${brainHud(o.index + 1, o.total, 'Intruso semántico')}
    <p class="brain-hint text-center mb-4">¿Cuál no pertenece al grupo?</p>
    <div class="brain-word-grid">
      ${t.words.map((w, i) => `<button type="button" onclick="oddoutPick(${i})" class="brain-word-card ${o.feedback && w === t.odd ? 'is-reveal' : ''} ${o.feedback && w !== t.odd && o.lastPick === i ? 'is-wrong' : ''}">${esc(w)}</button>`).join('')}
    </div>
    ${o.feedback ? `<p class="brain-feedback brain-feedback--${o.feedback} text-center mt-4">${o.feedback === 'ok' ? '✓ Categoría limpia' : '✗ Ese sí encajaba'}</p>` : ''}
  </div>`, { arena: true })
}

window.oddoutPick = function(wordIdx) {
  clearTrialDeadline()
  const o = brainState.oddout
  if (o.feedback) return
  const t = o.trials[o.index]
  o.lastPick = wordIdx
  const word = wordIdx >= 0 ? t.words[wordIdx] : ''
  const ok = word === t.odd
  o.feedback = ok ? 'ok' : 'bad'
  if (ok) { o.score++; playTone(523) } else playTone(200)
  markTrial(ok)
  render()
  brainTimers.push(setTimeout(() => {
    o.feedback = null
    o.lastPick = null
    o.index++
    if (o.index >= o.total) o.finished = true
    else queueArmTrial()
    render()
  }, ok ? 500 : 850))
}

function renderLogicGame() {
  const l = brainState.logic
  if (l.finished) return brainWrapper(`<div class="text-center">
    <p class="text-2xl mb-2">🧩</p>
    ${renderProtocolDebrief('logic', l.score, l.puzzles.length, brainFinishBtn(l.score, l.puzzles.length, 'logic', 'Terminar'))}</div>`)
  const p = l.puzzles[l.index]
  const answered = l.selected !== null
  const correct = answered && l.selected === p.answer
  return brainWrapper(`<div class="brain-arena">
    ${brainHud(l.index + 1, l.puzzles.length, 'Acertijos')}
    <p class="text-sm text-muted mb-4">Acertijo ${l.index + 1}/${l.puzzles.length} · ${l.score} aciertos</p>
    <p class="font-medium text-main mb-6 leading-relaxed">${p.q}</p>
    <div class="space-y-2">
      ${p.options.map((opt, i) => {
        let cls = 'logic-option w-full p-3 rounded-xl text-left text-main'
        if (answered && i === p.answer) cls += ' logic-option--correct'
        else if (answered && l.selected === i) cls += ' logic-option--wrong'
        return `<button onclick="logicAnswer(${i})" ${answered ? 'disabled' : ''} class="${cls}">${opt}</button>`
      }).join('')}
    </div>
    ${answered ? `<aside class="logic-explain card-static mt-4">
      <p class="logic-explain-label">${correct ? '✓ Correcto' : '✗ Incorrecto'} — Por qué</p>
      <p class="logic-explain-text">${p.explain || 'La respuesta sigue la lógica del enunciado. Relee las premisas una por una.'}</p>
      <button onclick="logicNext()" class="btn-primary w-full mt-3">${l.index + 1 >= l.puzzles.length ? 'Ver resultado' : 'Siguiente acertijo →'}</button>
    </aside>` : ''}
  </div>`)
}

window.logicAnswer = function(i) {
  clearTrialDeadline()
  const l = brainState.logic
  if (l.selected !== null) return
  l.selected = i
  const p = l.puzzles[l.index]
  const ok = i === p.answer
  if (ok) { l.score++; playTone(523) } else playTone(200)
  markTrial(ok)
  render()
}

window.logicNext = function() {
  const l = brainState.logic
  l.selected = null
  l.index++
  if (l.index >= l.puzzles.length) l.finished = true
  else queueArmTrial()
  render()
}

window.openLesson = function(id) {
  if (!isLessonUnlocked(id)) {
    showToast('Esta lección se desbloquea semana a semana en el catálogo', 0, 'mental')
    return
  }
  goLearn(brainState.schoolSection || 'curriculum', { resetLesson: false, resetPaper: true, skipRender: true })
  brainState.activeLesson = id
  brainState.lessonFlow = null
  navigate(`/gimnasia/leccion/${id}`)
}

window.closeLesson = function() {
  brainState.activeLesson = null
  brainState.lessonFlow = null
  navigate('/gimnasia/aprender')
  render()
}

window.completeLesson = function(id) {
  const wasDone = getCompletedLessons().includes(id)
  markLessonComplete(id)
  if (!wasDone) {
    awardXp('mental', 30, 'Lección de academia')
    const bonus = getLessonBonusXp()
    if (bonus > 0) awardXp('mental', bonus, `Dominio de lección (+${bonus})`)
    recordActivity('brain')
    processPlanAwards(checkPlanTask('brain'))
    import('/js/product-analytics.js').then(m => {
      m.trackProductEvent(m.EVENTS.SCHOOL_LESSON, { lessonId: id })
    }).catch(() => {})
  }
  const quiz = getLessonQuiz(id)
  brainState.lessonFlow = {
    id,
    phase: quiz ? 'quiz' : 'bridge',
    quizIndex: 0,
    quizScore: 0,
  }
  render()
}

window.answerLessonQuiz = function(choice) {
  const flow = brainState.lessonFlow
  if (!flow || flow.phase !== 'quiz') return
  const quiz = getLessonQuiz(flow.id)
  if (!quiz) { flow.phase = 'bridge'; render(); return }
  const q = quiz[flow.quizIndex]
  if (choice === q.correct) {
    flow.quizScore++
    playSuccess()
  } else playTone(220, 0.2)
  flow.quizIndex++
  if (flow.quizIndex >= quiz.length) flow.phase = 'bridge'
  render()
}

window.finishLessonFlow = function(skipReflect = false) {
  const flow = brainState.lessonFlow
  if (!flow) return
  const section = brainState.schoolSection || 'curriculum'
  brainState.lessonFlow = null
  brainState.activeLesson = null
  checkAndIssueCertificates()
  goLearn(section, { skipRender: true })
  navigate('/gimnasia/aprender')
}

window.completeLessonReview = completeLessonReview

window.setCatalogFilter = function(key, val) {
  brainState.catalogFilter = { ...brainState.catalogFilter, [key]: val }
  if (normalizeBrainView(brainState.brainView) !== 'learn') {
    brainState.schoolSection = 'explore'
    brainState.brainView = 'learn'
  }
  const apply = () => {
    if (patchCatalogUI(brainState.catalogFilter)) return
    render(true)
  }
  if (key === 'q') {
    clearTimeout(catalogFilterTimer)
    catalogFilterTimer = setTimeout(apply, 180)
    return
  }
  apply()
}

window.resetCatalogFilter = function() {
  brainState.catalogFilter = { q: '', category: 'all', faculty: 'all', region: 'all', duration: 'all', status: 'all' }
  if (patchCatalogUI(brainState.catalogFilter)) return
  render(true)
}

window.startReviewQuiz = function(id) {
  brainState.reviewFlow = { id, quizIndex: 0, quizScore: 0, phase: 'quiz' }
  goLearn('curriculum', { skipRender: true })
  navigate('/gimnasia/aprender')
}

window.answerReviewQuiz = function(choice) {
  const flow = brainState.reviewFlow
  if (!flow || flow.phase !== 'quiz') return
  const quiz = getReviewQuiz(flow.id)
  if (!quiz?.length) return
  const q = quiz[flow.quizIndex]
  if (choice === q.correct) {
    flow.quizScore++
    playSuccess()
  } else playTone(220, 0.2)
  flow.quizIndex++
  if (flow.quizIndex >= quiz.length) {
    flow.phase = 'done'
    completeLessonReview(flow.id)
    checkAndIssueCertificates()
  }
  render()
}

window.finishReviewQuiz = function() {
  brainState.reviewFlow = null
  goLearn('curriculum', { skipRender: true })
  navigate('/gimnasia/aprender')
}

window.openLibrary = function() {
  goLearn('library', { skipRender: true })
  navigate('/gimnasia/biblioteca')
}

window.openPaper = function(id) {
  brainState.activePaper = id
  brainState.paperMeta = { loading: true, crossref: null, openAlex: null, related: [] }
  const paper = getPaper(id)
  render()
  if (paper?.doi) {
    fetchPaperLiveMeta(paper).then(meta => {
      if (brainState.activePaper === id) {
        brainState.paperMeta = { ...meta, loading: false }
        render()
      }
    }).catch(() => {
      if (brainState.activePaper === id) {
        brainState.paperMeta = { loading: false, crossref: null, openAlex: null, related: [] }
        render()
      }
    })
  } else {
    brainState.paperMeta = { loading: false, crossref: null, openAlex: null, related: [] }
  }
}

window.searchPubMedLibrary = function() {
  const input = document.getElementById('pubmed-query')
  const query = (input?.value || brainState.pubmed.query || '').trim()
  if (!query) return
  brainState.pubmed = { query, results: [], loading: true }
  render()
  searchPubMed(query, 8).then(results => {
    brainState.pubmed = { query, results, loading: false }
    render()
  }).catch(() => {
    brainState.pubmed = { query, results: [], loading: false }
    render()
  })
}

window.closePaper = function() {
  brainState.activePaper = null
  brainState.paperMeta = null
  render()
}

window.setLibraryFilter = function(key, val) {
  brainState.libraryFilter = { ...brainState.libraryFilter, [key]: val }
  render()
}

window.downloadFacultyCert = function(id) {
  downloadFacultyCertificate(id)
}

window.goToLesson = function(id) {
  goLearn('curriculum', { resetLesson: false, skipRender: true })
  brainState.activeLesson = id
  brainState.lessonFlow = null
  navigate(`/gimnasia/leccion/${id}`)
}

window.goToLab = function(id) {
  goTrain('lab', { skipRender: true })
  startBrain(id)
  navigate('/gimnasia/laboratorio')
}

window.startLessonPractice = function(exId) {
  brainState.lessonFlow = null
  brainState.activeLesson = null
  goTrain('lab', { skipRender: true })
  startBrain(exId)
  navigate('/gimnasia/laboratorio')
}

function renderMemoryGame() {
  const m = brainState.memory
  const cfg = m.config
  if (m.phase === 'ready') return brainWrapper(`<div class="text-center">
    <h3 class="font-display text-xl font-semibold mb-2">Memoria de Colores</h3>
    <p class="text-muted mb-4">Empiezas en nivel ${cfg.start} con ${cfg.colors} colores</p>
    <button onclick="memoryStart()" class="btn-primary">Comenzar</button></div>`)
  if (m.phase === 'failed') return brainWrapper(`<div class="text-center">
    <p class="text-2xl mb-2">😔</p><p class="font-semibold mb-2">Nivel ${m.level}</p><p class="text-muted mb-6">${m.score} puntos</p>
    ${brainFinishBtn(m.score, m.level, 'memory', `Terminar (+${DIFFICULTIES[brainState.difficulty].xp} XP)`)}</div>`)
  const status = { showing: 'Observa...', input: 'Tu turno', success: '¡Correcto!' }[m.phase] || ''
  const colors = COLORS.slice(0, cfg.colors)
  return brainWrapper(`<div class="brain-game-panel text-center">
    <p id="memory-status" class="brain-game-label">Nv. ${m.level} · ${m.score} pts · ${status}</p>
    <div id="memory-grid" class="brain-grid brain-grid--3" role="group" aria-label="Memoria de colores">
      ${colors.map((color, i) => `<button type="button" id="memory-cell-${i}" onclick="memoryClick(${i})" ${m.phase !== 'input' ? 'disabled' : ''}
        class="brain-grid-cell memory-cell ${m.highlight === i ? 'is-lit' : ''}" style="--cell-color:${color}" aria-label="Color ${i + 1}"></button>`).join('')}
    </div></div>`)
}

window.memoryStart = function() {
  const m = brainState.memory
  const cfg = m.config
  m.sequence = Array.from({ length: m.level }, () => Math.floor(Math.random() * cfg.colors))
  m.userInput = []; m.phase = 'showing'; m.highlight = -1; render()
  let i = 0
  function showNext() {
    if (i < m.sequence.length) {
      m.highlight = m.sequence[i]
      if (!patchMemoryUI()) render()
      playTone(300 + m.sequence[i] * 80, 0.12)
      brainDelay(() => {
        m.highlight = -1
        if (!patchMemoryUI()) render()
        i++
        brainDelay(showNext, cfg.speed / 2)
      }, cfg.speed)
    } else { m.phase = 'input'; render() }
  }
  brainDelay(showNext, 500)
}

window.memoryClick = function(index) {
  const m = brainState.memory
  if (m.phase !== 'input') return
  m.userInput.push(index); playTone(300 + index * 80, 0.1)
  if (index !== m.sequence[m.userInput.length - 1]) { m.phase = 'failed'; render(); return }
  if (m.userInput.length === m.sequence.length) {
    m.score += m.level * 10; m.level++; m.phase = 'success'; render()
    brainDelay(() => window.memoryStart(), 1000)
  }
  render()
}

function renderSimonGame() {
  const s = brainState.simon
  if (s.phase === 'ready') return brainWrapper(`<div class="text-center">
    <h3 class="font-display text-xl font-semibold mb-2">Secuencia Numérica</h3>
    <p class="text-muted mb-6">Nivel inicial: ${s.config.start}</p>
    <button onclick="simonStart()" class="btn-primary">Comenzar</button></div>`)
  if (s.phase === 'failed') return brainWrapper(`<div class="text-center">
    <p class="font-semibold mb-6">Nivel ${s.level} · ${s.score} pts</p>
    ${brainFinishBtn(s.score, s.level, 'simon', 'Terminar')}</div>`)
  if (s.phase === 'showing') return brainWrapper(`<div class="brain-game-panel text-center">
    <p id="simon-display" class="brain-game-display">${s.showing >= 0 ? s.sequence[s.showing] : ''}</p></div>`)
  return brainWrapper(`<div class="brain-game-panel text-center">
    <p id="simon-label" class="brain-game-label">Nivel ${s.level}</p>
    <div id="simon-grid" class="brain-grid brain-grid--3" role="group" aria-label="Secuencia numérica">
      ${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => `<button type="button" onclick="simonClick(${n})" class="brain-grid-cell simon-cell">${n}</button>`).join('')}
    </div></div>`)
}

window.simonStart = function() {
  const s = brainState.simon
  s.sequence = Array.from({ length: s.level }, () => Math.floor(Math.random() * 9) + 1)
  s.userInput = []; s.phase = 'showing'; s.showing = -1; render()
  let i = 0
  const speed = s.config.speed
  function showNext() {
    if (i < s.sequence.length) {
      s.showing = i
      if (!patchSimonUI()) render()
      playTone(200 + s.sequence[i] * 50, 0.15)
      brainDelay(() => {
        s.showing = -1
        if (!patchSimonUI()) render()
        i++
        brainDelay(showNext, speed / 2)
      }, speed)
    } else { s.phase = 'input'; render() }
  }
  brainDelay(showNext, 500)
}

window.simonClick = function(n) {
  const s = brainState.simon
  if (s.phase !== 'input') return
  s.userInput.push(n); playTone(200 + n * 50, 0.1)
  if (n !== s.sequence[s.userInput.length - 1]) { s.phase = 'failed'; render(); return }
  if (s.userInput.length === s.sequence.length) {
    s.score += s.level * 15; s.level++; s.phase = 'success'; render()
    brainDelay(() => window.simonStart(), 1000)
  }
  render()
}

function renderMathGame() {
  const m = brainState.math
  if (!m.active) return brainWrapper(`<div class="text-center">
    <h3 class="font-display text-xl font-semibold mb-2">Cálculo Rápido</h3>
    <p class="text-muted mb-6">${m.timeLeft} segundos · Modo ${DIFFICULTIES[m.difficulty].label}</p>
    <button onclick="mathStart()" class="btn-primary">Comenzar</button></div>`)
  if (m.timeLeft <= 0) return brainWrapper(`<div class="text-center">
    <p class="text-2xl mb-2">⏱️</p><p class="font-semibold mb-6">${m.score} aciertos = ${m.score * 10} pts</p>
    ${brainFinishBtn(m.score, 10, 'math', 'Terminar')}</div>`)
  return brainWrapper(`<div class="text-center">
    <div class="flex justify-between text-sm text-muted mb-6"><span id="math-timer">${m.timeLeft}s</span><span id="math-score">${m.score} ✓</span></div>
    <p class="font-display text-4xl font-bold text-main mb-6">${m.problem.a} ${m.problem.op} ${m.problem.b} = ?</p>
    <form onsubmit="mathSubmit(event)">
      <input type="number" id="math-answer" value="${m.answer}" oninput="brainState.math.answer=this.value" class="input-field text-center text-2xl mb-4" autofocus>
      <button type="submit" class="btn-primary w-full">Confirmar</button>
    </form>
    ${m.feedback === 'wrong' ? `<p class="text-red-400 mt-2">✗ ${m.problem.result}</p>` : ''}
  </div>`)
}

window.mathStart = function() {
  const m = brainState.math
  m.active = true; m.score = 0; m.problem = genMathProblem(m.difficulty); m.answer = ''; m.feedback = null
  const prev = getMathTimer()
  if (prev) clearInterval(prev)
  setMathTimer(setInterval(() => {
    brainState.math.timeLeft--
    if (brainState.math.timeLeft <= 0) { clearInterval(getMathTimer()); setMathTimer(null); render() }
    else patchMathTimerDOM()
  }, 1000))
  render()
}

window.mathSubmit = function(e) {
  e.preventDefault()
  const m = brainState.math
  const val = parseInt(m.answer)
  if (val === m.problem.result) { m.score++; m.feedback = 'correct'; playTone(523) }
  else { m.feedback = 'wrong'; playTone(200) }
  m.answer = ''; m.problem = genMathProblem(m.difficulty)
  render()
  brainDelay(() => { m.feedback = null; render() }, 400)
}

export function syncGimnasiaRoute(sub = []) {
  if (sub[0] === 'leccion' && sub[1] && isLessonUnlocked(sub[1])) {
    brainState.activeLesson = sub[1]
    brainState.lessonFlow = null
    brainState.brainView = 'learn'
  } else if (sub[0] === 'biblioteca') {
    brainState.brainView = 'learn'
    brainState.schoolSection = 'library'
    if (sub[1]) brainState.activePaper = sub[1]
  } else if (sub[0] === 'inicio' || sub[0] === 'neuronas') brainState.brainView = 'home'
  else if (sub[0] === 'aprender' || sub[0] === 'escuela' || sub[0] === 'catalogo') {
    brainState.brainView = 'learn'
    if (sub[0] === 'catalogo') brainState.schoolSection = 'explore'
  } else if (sub[0] === 'entrenar' || sub[0] === 'programa' || sub[0] === 'laboratorio') {
    brainState.brainView = 'train'
    brainState.trainSection = (sub[0] === 'laboratorio' || sub[1] === 'laboratorio') ? 'lab' : 'program'
  } else if (sub[0] === 'cuerpo' || sub[0] === 'alimentacion' || sub[0] === 'ayuno') {
    brainState.brainView = 'body'
    brainState.bodySection = sub[0] === 'ayuno' ? 'fasting' : 'nutrition'
  }
  brainState.brainView = normalizeBrainView(brainState.brainView)
}

export function clearEphemeralBrainState() {
  destroyActiveProtocol()
  clearBrainTimers()
  brainState._trialBusy = false
  brainState.mode = 'hub'
  brainState.protocolBrief = null
  brainState.session = null
  brainState.activeLesson = null
  brainState.lessonFlow = null
  brainState.activePaper = null
  brainState.paperMeta = null
  brainState.reviewFlow = null
  brainState.exercise = null
  unmountSynapseField()
  synapseCanvasEl = null
  lastSynapseView = null
}

window.exportBrainReportPdf = function(exerciseId) {
  const stateKey = exerciseId === 'dualnback' ? 'dualnback' : exerciseId
  const s = brainState[stateKey]
  const metrics = s?.metrics
  if (!metrics) {
    showToast('No hay informe para exportar', 0, 'mental')
    return
  }
  const history = getProtocolHistory(exerciseId)
  const payload = getClinicalReportExportPayload(exerciseId, metrics, history)
  const ok = exportClinicalReportPdf(payload)
  if (!ok) showToast('Permite ventanas emergentes para exportar PDF', 0, 'mental')
}

export function bindBrainGymGlobals() {
  window.brainState = brainState
  window.startBrain = startBrain
  window.finishBrain = finishBrain
  window.endExerciseBlock = endExerciseBlock
  bindBrainNavGlobals()
  window.exitExercise = function() {
    destroyActiveProtocol()
    clearBrainTimers()
    brainState.exercise = null
    goTrain(brainState.trainSection === 'lab' ? 'lab' : 'program')
  }
}

initProtocolContext({
  brainState,
  render,
  brainWrapper,
  brainHud,
  markTrial,
  playTone,
  ensureClinicalLab,
  brainTimers,
  brainDelay,
  clearTrialDeadline,
  startTrialDeadline,
  syncBrainLabChrome,
  getIntensity,
  renderProtocolIntro,
  getExerciseLevel,
})
buildClinicalProtocolRegistry({ renderDualNBackGame })
registerFreeLabProtocols({
  renderDualNBackGame,
  renderRevSpanGame,
  renderPasatGame,
  renderSwitchingGame,
  renderCorsiGame,
  renderSymbolsGame,
  renderLogicGame,
  renderMathGame,
  renderMemoryGame,
  renderSimonGame,
  renderSequenceGame,
  renderReactionGame,
  renderAnagramGame,
  renderOddOutGame,
})

wireBrainRuntime({
  renderExercise: renderBrainExercise,
  syncChrome: syncBrainLabChrome,
  patchTrialHud: patchTrialHudDOM,
  getLiveStatus: getExerciseLiveStatus,
})

export { brainState, renderBrainGym, patchBrainExerciseUI, startBrain, finishBrain, endExerciseBlock }
