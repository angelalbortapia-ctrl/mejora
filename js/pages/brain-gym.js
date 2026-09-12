/** Gimnasia cerebral — escuela, laboratorio, sesiones guiadas */

import {
  getItem, setItem, getToday, esc, getSettings, saveSettings, DIFFICULTIES,
  getStats, updateStats, recordActivity, checkPlanTask, addXp,
} from '../core.js'
import {
  genMathProblem, getMemoryConfig, getSimonConfig, getLogicPuzzles, getWordGroup, getAnagrams, pickSequence,
} from '../content.js'
import {
  COGNITIVE_DOMAINS, EXERCISES, getTodaysSession, getDomainProgress, getProgramStats,
  completeSession, isSessionDoneToday, PROGRAM_DISCLAIMER, getExerciseLevel, updateExerciseLevel,
} from '../brain-program.js'
import {
  initNBack, initStroop, initFlanker, initSwitching, initGoNoGo, initCorsi, corsiGenerateSequence,
  initSymbols, flankerArrows, getSwitchAnswer, STROOP_COLORS,
} from '../brain-exercises.js'
import { tabBar, subTabBar, pageHero } from '../ui.js?v=82'
import { playTone, playClick } from '../sounds.js'
import { showToast, awardXp, processPlanAwards } from '../awards.js'
import { guardDifficulty } from '../page-helpers.js'
import { parsePath, navigate } from '../router.js'
import {
  getDailyLesson, getWeeklyLesson, getWeeklyLessonMeta, LESSONS, LAB_EXERCISE_IDS, LAB_EXERCISE_GROUPS, EXERCISE_REAL_WORLD,
  renderLessonCard, renderLessonFull, renderNeuroPunchBanner, renderDebateBanner, renderLegendaryHall,
  renderHomeNeuroCard, renderLessonPostFlow, getLessonQuiz, markLessonComplete, getCompletedLessons,
  getSessionDebrief, isLessonUnlocked, getUnlockedLessonCount, isLegendaryLesson, getLessonBonusXp,
} from '../brain-academy.js?v=87'
import {
  renderSchoolHub, completeLessonReview, renderHomeReviewBanner,
  renderReviewQuizFlow, getReviewQuiz, getSchoolStats,
} from '../school.js?v=82'
import { renderCatalogPage } from '../school-catalog.js?v=82'
import { wrapSchoolPage } from '../school-shell.js?v=82'
import { renderPaperDetail, getPaper, fetchPaperLiveMeta, searchPubMed } from '../school-library.js?v=82'
import { downloadFacultyCertificate, checkAndIssueCertificates } from '../school-certificates.js?v=82'

function render(immediate = false) {
  if (typeof window.render === 'function') window.render(immediate)
}

let brainState = {
  exercise: null, difficulty: 'medio', mode: 'hub', brainView: 'school', schoolFaculty: null, schoolSection: 'curriculum',
  catalogFilter: { q: '', category: 'all', faculty: 'all', region: 'all', duration: 'all', status: 'all' },
  libraryFilter: { q: '', topic: 'all' }, pubmed: { query: '', results: [], loading: false },
  activePaper: null, paperMeta: null, reviewFlow: null,
  activeLesson: null, lessonFlow: null,
  session: null, memory: {}, math: {}, words: {}, simon: {}, logic: {}, anagrams: {}, trivia: {},
  nback: {}, stroop: {}, flanker: {}, switching: {}, gonogo: {}, corsi: {}, symbols: {},
}
let brainTimers = []
function clearBrainTimers() { brainTimers.forEach(t => clearTimeout(t)); brainTimers = [] }
let logicSession = { puzzles: [], index: 0, score: 0, difficulty: 'medio', finished: false, selected: null }
// --- Brain Gym (programa neurociencia + academia) ---
function getLabExercises() {
  return LAB_EXERCISE_IDS.map(id => EXERCISES[id]).filter(Boolean)
}

function renderLabGameCard(ex) {
  const dom = COGNITIVE_DOMAINS[ex.domain]
  const rw = EXERCISE_REAL_WORLD[ex.id]
  return `<button onclick="startBrain('${ex.id}')" class="card game-card game-card--lab text-left">
    <div class="flex items-start gap-4">
      <span class="text-3xl game-icon">${ex.icon}</span>
      <div class="flex-1">
        <h3 class="font-semibold text-main">${ex.name}</h3>
        <p class="text-xs text-muted mt-0.5">${ex.paradigm}</p>
        <p class="text-sm text-muted mt-2">${ex.desc}</p>
        ${ex.brainScan ? `<p class="text-xs mt-2 academy-brain-scan">🧠 fMRI: ${ex.brainScan}</p>` : ''}
        ${rw ? `<p class="text-xs mt-2 academy-real-world">🌍 En la vida: ${rw}</p>` : ''}
        ${dom ? `<p class="text-xs text-muted mt-2">${dom.icon} ${dom.name} · Nv.${getExerciseLevel(ex.id)}</p>` : ''}
      </div>
    </div></button>`
}

function renderBrainExercise() {
  const id = brainState.exercise
  if (!LAB_EXERCISE_IDS.includes(id)) {
    brainState.exercise = null
    return `<div class="page-shell page-wide"><div class="card text-center p-8">
      <p class="text-muted mb-4">Ejercicio no disponible en el laboratorio.</p>
      <button onclick="brainState.exercise=null;render()" class="btn-primary">Volver al laboratorio</button></div></div>`
  }
  if (id === 'nback') return renderNBackGame()
  if (id === 'stroop') return renderStroopGame()
  if (id === 'flanker') return renderFlankerGame()
  if (id === 'switching') return renderSwitchingGame()
  if (id === 'gonogo') return renderGoNoGoGame()
  if (id === 'corsi') return renderCorsiGame()
  if (id === 'symbols') return renderSymbolsGame()
  if (id === 'logic') return renderLogicGame()
  if (id === 'math') return renderMathGame()
  if (id === 'memory') return renderMemoryGame()
  if (id === 'simon') return renderSimonGame()
  if (id === 'sequence') return renderSequenceGame()
  return ''
}

const BRAIN_TAB_RESET = 'brainState.activeLesson=null;brainState.schoolFaculty=null;brainState.schoolSection=\'curriculum\';brainState.activePaper=null;'

function brainTabDefs() {
  return [
    { id: 'school', label: 'Escuela', icon: '🏫' },
    { id: 'academy', label: 'Catálogo', icon: '📚' },
    { id: 'lab', label: 'Laboratorio', icon: '🔬' },
    { id: 'program', label: 'Programa', icon: '📋' },
  ]
}

function renderBrainTabsHtml() {
  return tabBar(
    brainTabDefs(),
    brainState.brainView || 'school',
    'brainState.brainView',
    BRAIN_TAB_RESET,
  )
}

function brainHubShellClass() {
  const view = brainState.brainView || 'school'
  const parts = ['page-shell', 'page-wide', 'page-brain']
  if (view === 'school' || view === 'academy') parts.push('page-school')
  if (view === 'lab') parts.push('brain-lab')
  return parts.join(' ')
}

function brainHubPageClass() {
  const view = brainState.brainView || 'school'
  const parts = ['ds-page', 'ds-page--full']
  if (view === 'school' || view === 'academy') parts.push('brain-campus')
  return parts.join(' ')
}

function renderBrainHubBody() {
  const stats = getProgramStats()
  const domains = getDomainProgress()
  const todaySession = getTodaysSession()
  const diff = brainState.difficulty
  const d = DIFFICULTIES[diff]
  const view = brainState.brainView || 'school'

  if (view === 'school') {
    if (brainState.activePaper) {
      const paper = getPaper(brainState.activePaper)
      return paper
        ? wrapSchoolPage(renderPaperDetail(paper, brainState.paperMeta), 'library', { stats: getSchoolStats() })
        : ''
    }
    return renderSchoolHub(brainState.schoolFaculty, brainState.schoolSection, {
      pubmed: brainState.pubmed,
      libraryFilter: brainState.libraryFilter,
    })
  }

  if (view === 'academy') {
    const weekly = getWeeklyLessonMeta()
    return renderCatalogPage(brainState.catalogFilter, weekly)
  }

  if (view === 'lab') {
    const games = getLabExercises()
    const labSections = LAB_EXERCISE_GROUPS.map(g => {
      const items = g.ids.map(id => EXERCISES[id]).filter(Boolean)
      return `<div class="span-full brain-lab-group">
        <h3 class="ds-section-title">${g.label}</h3>
        <div class="brain-games-grid">${items.map(renderLabGameCard).join('')}</div>
      </div>`
    }).join('')
    return `${pageHero('Laboratorio', '12 ejercicios · protocolos + entrenamiento cognitivo', games.length, 'disponibles')}
      <p class="ds-lead span-full">Protocolos con respaldo en neuroimagen y entrenamiento de velocidad, memoria y patrones.</p>
      ${difficultyPicker(diff, 'setBrainDiff')}
      ${labSections}`
  }

  return `${pageHero('Entrenamiento', 'Sesión guiada de paradigmas cognitivos', stats.doneToday ? '✓' : '○', 'sesión hoy')}

    <div class="brain-dashboard">
    <div class="card program-hero card-static brain-hero">
      <p class="text-xs text-muted mb-2">📋 Sesión de hoy · ${todaySession.length} ejercicios · ~20 min</p>
      <div class="flex flex-wrap gap-2 mb-4">
        ${todaySession.map((ex, i) => `<span class="text-xs px-2 py-1 rounded-full" style="background:var(--primary-soft);color:var(--primary)">${i + 1}. ${ex.icon} ${ex.name}</span>`).join('')}
      </div>
      ${stats.doneToday
        ? `<p class="text-main font-medium mb-3">✅ Sesión completada hoy</p>
           <button onclick="startGuidedSession(true)" class="btn-secondary w-full">Repetir sesión</button>`
        : `<button onclick="startGuidedSession()" class="btn-primary w-full text-lg py-4">▶ Iniciar sesión guiada</button>`}
      <p class="text-xs text-muted mt-3 text-center">${stats.weekSessions}/${stats.weekTarget} sesiones esta semana (meta: 3×)</p>
      <button type="button" onclick="openLesson('${getWeeklyLesson().id}')" class="btn-secondary w-full mt-3">🎓 Academia · lección semana ${getWeeklyLessonMeta().week}</button>
    </div>

    <div class="card p-4 card-static brain-disclaimer">
      <p class="text-xs text-muted leading-relaxed">${PROGRAM_DISCLAIMER}</p>
    </div>

    <div class="brain-side card card-static">
      <h3 class="home-panel-title">Tu programa</h3>
      <p class="home-panel-sub mb-3">${stats.weekSessions}/${stats.weekTarget} sesiones esta semana</p>
      <div class="space-y-2 text-sm">
        <div class="flex justify-between"><span class="text-muted">Hoy</span><span class="text-main">${stats.doneToday ? '✅ Hecha' : 'Pendiente'}</span></div>
        <div class="flex justify-between"><span class="text-muted">Dificultad</span><span class="text-main">${d.icon} ${d.label}</span></div>
        <div class="flex justify-between"><span class="text-muted">Lecciones</span><span class="text-main">${getCompletedLessons().length}/${LESSONS.length}</span></div>
      </div>
    </div>

    <div class="brain-domains">
    <h2 class="section-title">Dominios cognitivos</h2>
    <div class="brain-domain-grid">
      ${domains.map(dom => `<div class="card card-static p-4">
        <div class="flex items-center gap-2 mb-2">
          <span class="text-2xl">${dom.icon}</span>
          <div><p class="font-semibold text-main text-sm">${dom.name}</p>
          <p class="text-xs text-muted">Nv. ${dom.level} · ${dom.xp} XP</p></div>
        </div>
        <p class="text-xs text-muted mb-1">${dom.region}</p>
        <div class="progress-track w-full mt-2" style="height:4px">
          <div class="progress-fill h-full" style="width:${(dom.xp % 100)}%;background:${dom.color}"></div>
        </div>
      </div>`).join('')}
    </div>
    </div>

    </div>`
}

function renderBrainHubShell({ animate = true } = {}) {
  const anim = animate && !document.getElementById('brain-gym-hub') ? 'animate-fade-in' : ''
  return `<div id="brain-gym-shell" class="${anim} ${brainHubShellClass()}">
    <div class="${brainHubPageClass()}" id="brain-gym-page">
      <div id="brain-gym-tabs-wrap">${renderBrainTabsHtml()}</div>
      <div id="brain-gym-hub">${renderBrainHubBody()}</div>
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
  return true
}

function renderBrainGym() {
  if (brainState.reviewFlow) {
    return `<div class="animate-fade-in page-shell page-wide page-brain page-school">
      <div class="ds-page ds-page--full">${renderReviewQuizFlow(brainState.reviewFlow)}</div>
    </div>`
  }
  if (brainState.session?.phase === 'debrief') return renderSessionDebrief()
  if (brainState.session?.phase === 'intro' && !brainState.exercise) return renderSessionIntro()
  if (brainState.exercise) return renderBrainExercise()

  if (brainState.brainView === 'school' && brainState.activeLesson) {
    if (brainState.lessonFlow?.id === brainState.activeLesson) {
      return `<div class="animate-fade-in page-shell page-wide page-brain">
        <div class="ds-page ds-page--full">${renderBrainTabsHtml()}${renderLessonPostFlow(brainState.lessonFlow)}</div>
      </div>`
    }
    const lesson = LESSONS.find(l => l.id === brainState.activeLesson)
    return lesson ? renderLessonFull(lesson) : ''
  }

  if (brainState.brainView === 'academy' && brainState.activeLesson) {
    if (brainState.lessonFlow?.id === brainState.activeLesson) {
      return `<div class="animate-fade-in page-shell page-wide page-brain">
        <div class="ds-page ds-page--full">${renderLessonPostFlow(brainState.lessonFlow)}</div>
      </div>`
    }
    const lesson = LESSONS.find(l => l.id === brainState.activeLesson)
    return lesson ? renderLessonFull(lesson) : ''
  }

  return renderBrainHubShell()
}

function renderSessionIntro() {
  const s = brainState.session
  const ex = s.exercises[s.current]
  const dom = ex.domainInfo
  return `<div class="animate-fade-in page-shell page-wide page-brain">
    <div class="exercise-dashboard">
    <div class="exercise-side">
      <button onclick="cancelSession()" class="btn-ghost mb-4">← Cancelar</button>
      <p class="text-sm text-muted">Ejercicio ${s.current + 1} de ${s.exercises.length}</p>
    </div>
    <div class="card text-center exercise-stage">
      <span class="text-5xl">${ex.icon}</span>
      <h2 class="font-display text-2xl font-bold text-main mt-3">${ex.name}</h2>
      <p class="text-sm text-muted mt-1">${ex.paradigm}</p>
      <div class="mt-4 p-3 rounded-xl text-left" style="background:var(--primary-soft)">
        <p class="text-xs font-semibold text-main mb-1">${dom.icon} ${dom.name}</p>
        <p class="text-xs text-muted">${dom.theory}</p>
        <p class="text-xs text-muted mt-2 italic">${ex.desc}</p>
        ${ex.brainScan ? `<p class="text-xs mt-2 academy-brain-scan">🧠 ${ex.brainScan}</p>` : ''}
        ${EXERCISE_REAL_WORLD[ex.id] ? `<p class="text-xs mt-2 academy-real-world">🌍 ${EXERCISE_REAL_WORLD[ex.id]}</p>` : ''}
      </div>
      <p class="text-xs text-muted mt-3">Nivel adaptativo: ${ex.level} · ~${ex.duration}</p>
      <button onclick="launchSessionExercise()" class="btn-primary w-full py-4 mt-4">Comenzar ejercicio</button>
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
  if (!repeat && isSessionDoneToday()) return
  brainState.mode = 'session'
  brainState.session = {
    exercises: getTodaysSession(),
    current: 0,
    results: [],
    phase: 'intro',
  }
  brainState.brainView = 'program'
  render()
}

window.cancelSession = function() {
  clearBrainTimers()
  brainState.mode = 'hub'
  brainState.session = null
  brainState.exercise = null
  render()
}

window.launchSessionExercise = function() {
  const s = brainState.session
  const ex = s.exercises[s.current]
  s.phase = 'playing'
  startBrain(ex.id, true)
}

window.submitSessionDebrief = function(avgPct) {
  finishGuidedSession(avgPct)
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
  render()
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
  if (!LAB_EXERCISE_IDS.includes(id)) {
    showToast('Ejercicio no disponible', 0, 'mental')
    return
  }
  const diff = brainState.difficulty
  const level = fromSession ? getExerciseLevel(id) : 1
  brainState.exercise = id
  if (id === 'nback') brainState.nback = initNBack(level, diff === 'experto' ? 24 : diff === 'facil' ? 14 : 18)
  if (id === 'stroop') brainState.stroop = initStroop(diff === 'experto' ? 20 : 14)
  if (id === 'flanker') brainState.flanker = initFlanker(diff === 'experto' ? 24 : 16)
  if (id === 'switching') brainState.switching = initSwitching(diff === 'experto' ? 28 : 20)
  if (id === 'gonogo') brainState.gonogo = initGoNoGo(diff === 'experto' ? 36 : 24)
  if (id === 'corsi') brainState.corsi = initCorsi(level + 1)
  if (id === 'symbols') brainState.symbols = initSymbols(16, diff === 'experto' ? 35 : 50)
  if (id === 'logic') brainState.logic = { puzzles: getLogicPuzzles(diff, diff === 'experto' ? 8 : diff === 'dificil' ? 6 : 5), index: 0, score: 0, selected: null, finished: false, difficulty: diff }
  if (id === 'math') brainState.math = { active: false, score: 0, timeLeft: diff === 'experto' ? 90 : diff === 'facil' ? 45 : 60, difficulty: diff, problem: null, answer: '', feedback: null }
  if (id === 'memory') brainState.memory = { phase: 'ready', level: 1, score: 0, config: getMemoryConfig(diff), sequence: [], input: [], highlight: null }
  if (id === 'simon') brainState.simon = { phase: 'ready', level: 1, score: 0, sequence: [], input: [], showing: -1, config: getSimonConfig(diff) }
  if (id === 'sequence') brainState.sequence = { round: 0, total: 5, score: 0, difficulty: diff, seq: pickSequence(diff), answer: null, finished: false }
  render()
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
  const xp = Math.floor((DIFFICULTIES[diff]?.xp || 30) * (1 + score / 100))
  awardXp('mental', xp, 'Ejercicio mental')
  processPlanAwards(checkPlanTask('brain'))
  brainState.exercise = null
  render()
}

// --- Paradigmas neurociencia ---
function renderNBackGame() {
  const s = brainState.nback
  if (s.finished) return brainWrapper(`<div class="text-center">
    <p class="text-2xl mb-2">🔁</p><p class="font-semibold mb-2">${s.n}-Back completado</p>
    <p class="text-muted mb-6">${s.score}/${s.trials} aciertos (${s.trials ? Math.round(s.score / s.trials * 100) : 0}%)</p>
    ${brainFinishBtn(s.score, s.trials || 1, 'nback')}</div>`)
  if (s.phase === 'ready') return brainWrapper(`<div class="text-center">
    <h3 class="font-display text-xl font-semibold mb-2">${s.n}-Back auditivo-visual</h3>
    <p class="text-sm text-muted mb-4">Pulsa <strong>COINCIDE</strong> cuando la letra sea igual a la de hace ${s.n} posición${s.n > 1 ? 'es' : ''}.</p>
    <p class="text-xs text-muted mb-6">Entrena memoria de trabajo (red frontoparietal).</p>
    <button onclick="nbackStart()" class="btn-primary">Iniciar</button></div>`)
  const letter = s.stream[s.index]
  const isMatch = s.index >= s.n && letter === s.stream[s.index - s.n]
  return brainWrapper(`<div class="text-center">
    <p class="text-xs text-muted mb-2">Trial ${s.index + 1}/${s.total + s.n} · ${s.n}-Back</p>
    <p class="font-display text-6xl font-bold text-main mb-6">${letter}</p>
    <div class="flex gap-3 justify-center">
      <button onclick="nbackRespond(false)" class="btn-secondary flex-1">Pasar</button>
      <button onclick="nbackRespond(true)" class="btn-primary flex-1">¡Coincide!</button>
    </div>
    ${s.feedback ? `<p class="text-sm mt-3 ${s.feedback === 'ok' ? 'text-green-600' : 'text-red-500'}">${s.feedback === 'ok' ? '✓' : '✗'}</p>` : ''}
  </div>`)
}

window.nbackStart = function() {
  const s = brainState.nback
  s.phase = 'play'; s.index = 0; render()
}

window.nbackRespond = function(saidMatch) {
  const s = brainState.nback
  if (s.phase !== 'play' || s.responded) return
  const isMatch = s.index >= s.n && s.stream[s.index] === s.stream[s.index - s.n]
  const correct = saidMatch === isMatch
  if (correct) s.score++
  if (correct) { s.feedback = 'ok'; playTone(523) } else { s.feedback = 'bad'; playTone(200) }
  s.trials++; s.responded = true
  render()
  brainTimers.push(setTimeout(() => {
    s.feedback = null; s.responded = false; s.index++
    if (s.index >= s.total + s.n) s.finished = true
    render()
  }, 500))
}

function renderStroopGame() {
  const s = brainState.stroop
  if (s.finished) return brainWrapper(`<div class="text-center">
    <p class="font-semibold mb-6">${s.score}/${s.total} · Stroop</p>
    ${brainFinishBtn(s.score, s.total, 'stroop')}</div>`)
  const t = s.trials[s.index]
  return brainWrapper(`<div class="text-center">
    <p class="text-xs text-muted mb-4">${s.index + 1}/${s.total} · Nombra el COLOR de la tinta</p>
    <p class="font-display text-4xl font-bold mb-6" style="color:${t.ink}">${t.word}</p>
    <div class="grid grid-cols-2 gap-2">
      ${STROOP_COLORS.map(c => `<button onclick="stroopAnswer('${c.name}')" class="p-3 rounded-xl font-semibold text-sm" style="border:2px solid ${c.hex};color:${c.hex}">${c.name}</button>`).join('')}
    </div></div>`)
}

window.stroopAnswer = function(name) {
  const s = brainState.stroop
  const t = s.trials[s.index]
  if (name === t.correct) { s.score++; playTone(523) } else playTone(200)
  s.index++
  if (s.index >= s.total) s.finished = true
  render()
}

function renderFlankerGame() {
  const s = brainState.flanker
  if (s.finished) return brainWrapper(`<div class="text-center">
    <p class="font-semibold mb-6">${s.score}/${s.total}</p>
    ${brainFinishBtn(s.score, s.total, 'flanker')}</div>`)
  const t = s.trials[s.index]
  return brainWrapper(`<div class="text-center">
    <p class="text-xs text-muted mb-6">${s.index + 1}/${s.total} · Dirección de la flecha CENTRAL</p>
    <p class="font-display text-3xl tracking-widest text-main mb-8">${flankerArrows(t)}</p>
    <div class="flex gap-3 justify-center">
      <button onclick="flankerAnswer('left')" class="btn-secondary flex-1 text-2xl">←</button>
      <button onclick="flankerAnswer('right')" class="btn-secondary flex-1 text-2xl">→</button>
    </div></div>`)
}

window.flankerAnswer = function(dir) {
  const s = brainState.flanker
  const t = s.trials[s.index]
  if (dir === t.dir) { s.score++; playTone(523) } else playTone(200)
  s.index++
  if (s.index >= s.total) s.finished = true
  render()
}

function renderSwitchingGame() {
  const s = brainState.switching
  if (s.finished) return brainWrapper(`<div class="text-center">
    <p class="font-semibold mb-6">${s.score}/${s.total}</p>
    ${brainFinishBtn(s.score, s.total, 'switching')}</div>`)
  const t = s.trials[s.index]
  const ruleLabel = t.rule === 'parity' ? '¿Es PAR o IMPAR?' : '¿Es mayor o menor que 5?'
  return brainWrapper(`<div class="text-center">
    <p class="text-xs text-muted mb-2">${s.index + 1}/${s.total}</p>
    <p class="badge-diff mb-4">${ruleLabel}</p>
    <p class="font-display text-5xl font-bold text-main mb-8">${t.num}</p>
    ${t.rule === 'parity'
      ? `<div class="flex gap-3"><button onclick="switchAnswer('even')" class="btn-secondary flex-1">Par</button><button onclick="switchAnswer('odd')" class="btn-secondary flex-1">Impar</button></div>`
      : `<div class="flex gap-3"><button onclick="switchAnswer('low')" class="btn-secondary flex-1">≤ 5</button><button onclick="switchAnswer('high')" class="btn-secondary flex-1">&gt; 5</button></div>`}
  </div>`)
}

window.switchAnswer = function(ans) {
  const s = brainState.switching
  const t = s.trials[s.index]
  if (getSwitchAnswer(t, ans)) { s.score++; playTone(523) } else playTone(200)
  s.index++
  if (s.index >= s.total) s.finished = true
  render()
}

function renderGoNoGoGame() {
  const s = brainState.gonogo
  if (s.finished) return brainWrapper(`<div class="text-center">
    <p class="font-semibold mb-6">${s.score}/${s.total}</p>
    ${brainFinishBtn(s.score, s.total, 'gonogo')}</div>`)
  if (!s.started) {
    brainTimers.push(setTimeout(() => { if (brainState.exercise === 'gonogo') { s.started = true; gonogoNext() } }, 100))
    return brainWrapper(`<div class="text-center py-12"><p class="text-muted">Iniciando Go/No-Go...</p></div>`)
  }
  if (s.waiting) return brainWrapper(`<div class="text-center py-12"><p class="text-muted">Prepárate...</p></div>`)
  const t = s.trials[s.index]
  const color = t.type === 'go' ? '#00f5d4' : '#fb7185'
  const label = t.type === 'go' ? 'GO' : 'NO-GO'
  return brainWrapper(`<div class="text-center">
    <p class="text-xs text-muted mb-4">${s.index + 1}/${s.total}</p>
    <div class="w-32 h-32 rounded-full mx-auto mb-6 flex items-center justify-center font-bold text-white text-xl" style="background:${color}">${label}</div>
    ${t.type === 'go'
      ? `<button onclick="gonogoTap()" class="btn-primary w-full py-4">¡Tocar!</button>`
      : `<p class="text-sm text-muted">No toques — espera...</p>`}
  </div>`)
}

window.gonogoTap = function() {
  const s = brainState.gonogo
  const t = s.trials[s.index]
  if (t.type === 'go') { s.score++; playTone(523) } else playTone(200)
  gonogoNext()
}

function gonogoNext() {
  const s = brainState.gonogo
  s.index++
  if (s.index >= s.total) { s.finished = true; render(); return }
  s.waiting = true; render()
  brainTimers.push(setTimeout(() => {
    s.waiting = false; render()
    const t = s.trials[s.index]
    if (t.type === 'nogo') {
      brainTimers.push(setTimeout(() => {
        if (s.index < s.total && !s.finished && brainState.exercise === 'gonogo') {
          s.score++; playTone(523); gonogoNext()
        }
      }, 1200))
    }
  }, 600))
}

window.gonogoStart = function() { gonogoNext() }

function renderCorsiGame() {
  const c = brainState.corsi
  if (c.finished) return brainWrapper(`<div class="text-center">
    <p class="font-semibold mb-6">Span ${c.level - 1} · ${c.score} pts</p>
    ${brainFinishBtn(c.score, c.maxRounds, 'corsi')}</div>`)
  if (c.phase === 'ready') return brainWrapper(`<div class="text-center">
    <h3 class="font-display text-xl font-semibold mb-2">Bloques Corsi</h3>
    <p class="text-sm text-muted mb-6">Memoria espacial · secuencia de ${c.level} bloques</p>
    <button onclick="corsiStart()" class="btn-primary">Comenzar</button></div>`)
  return brainWrapper(`<div class="brain-game-panel text-center">
    <p id="corsi-label" class="brain-game-label">Nivel ${c.level} · Ronda ${c.rounds + 1}/${c.maxRounds}</p>
    <div id="corsi-grid" class="brain-grid brain-grid--3" role="group" aria-label="Bloques Corsi">
      ${Array.from({ length: 9 }, (_, i) => `<button type="button" id="corsi-cell-${i}" onclick="corsiTap(${i})" ${c.phase !== 'input' ? 'disabled' : ''}
        class="brain-grid-cell corsi-cell ${c.highlight === i ? 'is-lit' : ''}" aria-label="Bloque ${i + 1}"></button>`).join('')}
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
      c.highlight = c.sequence[i]; render(); playTone(400 + i * 80, 0.12)
      brainTimers.push(setTimeout(() => { c.highlight = -1; render(); i++; brainTimers.push(setTimeout(show, 300)) }, 500))
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
    <p class="font-semibold mb-6">${s.score} aciertos</p>
    ${brainFinishBtn(s.score, s.total, 'symbols')}</div>`)
  if (!s.active) return brainWrapper(`<div class="text-center">
    <h3 class="font-display text-xl font-semibold mb-2">Símbolos-Dígitos</h3>
    <p class="text-sm text-muted mb-4">Velocidad de procesamiento (WAIS-IV adaptado)</p>
    <div class="flex justify-center gap-4 mb-6 text-sm">
      ${s.map.map(m => `<span>${m.sym} = ${m.digit}</span>`).join('')}
    </div>
    <button onclick="symbolsStart()" class="btn-primary">Iniciar (${s.timeLeft}s)</button></div>`)
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
    else if (!patchLiveUI('/gimnasia')) render()
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

function brainFinishBtn(score, total, id, xpLabel = 'Continuar') {
  const fn = brainState.mode === 'session'
    ? `endExerciseBlock(${score},${total},'${id}')`
    : `finishBrain(${score})`
  return `<button onclick="${fn}" class="btn-primary">${xpLabel}</button>`
}

function brainWrapper(content) {
  const d = DIFFICULTIES[brainState.difficulty]
  const backFn = brainState.mode === 'session' ? 'cancelSession()' : 'brainState.exercise=null;render()'
  return `<div class="page-shell page-exercise route-enter">
    <div class="exercise-dashboard exercise-dashboard--focus">
      <div class="exercise-focus-bar">
        <button type="button" onclick="${backFn}" class="btn-ghost">← Volver</button>
        <span class="ds-chip ds-chip--accent">${d.icon} ${d.label}</span>
      </div>
      <div class="card exercise-stage exercise-stage--focus">${content}</div>
    </div>
  </div>`
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

function patchBrainExerciseUI() {
  const id = brainState.exercise
  if (!id) return false
  if (id === 'corsi') return patchCorsiUI()
  if (id === 'memory') return patchMemoryUI()
  if (id === 'simon') return patchSimonUI()
  if (id === 'symbols' && brainState.symbols.active && !brainState.symbols.finished) {
    const timer = document.getElementById('symbols-timer')
    if (!timer) return false
    const s = brainState.symbols
    timer.textContent = `⏱ ${s.timeLeft}s · ${s.index + 1}/${s.total}`
    return true
  }
  if (id === 'math' && brainState.math.active && brainState.math.timeLeft > 0) {
    const timer = document.getElementById('math-timer')
    const score = document.getElementById('math-score')
    if (!timer) return false
    timer.textContent = `${brainState.math.timeLeft}s`
    if (score) score.textContent = `${brainState.math.score} ✓`
    return true
  }
  return false
}

function genSequence(difficulty) {
  return pickSequence(difficulty)
}

function renderSequenceGame() {
  const s = brainState.sequence
  if (s.finished) return brainWrapper(`<div class="text-center">
    <p class="text-2xl mb-2">📐</p><p class="font-semibold mb-6">${s.score}/${s.total} correctos</p>
    ${brainFinishBtn(s.score, s.total, 'sequence', `Terminar (+${Math.floor(DIFFICULTIES[s.difficulty].xp * (s.score / s.total))} XP)`)}</div>`)
  return brainWrapper(`<div class="text-center">
    <p class="text-sm text-muted mb-4">Ronda ${s.round + 1}/${s.total}</p>
    <p class="font-display text-2xl font-bold text-main mb-2">${s.current.seq.join(', ')}, ?</p>
    <p class="text-muted text-sm mb-6">¿Cuál es el siguiente número?</p>
    <div class="grid grid-cols-2 gap-3">
      ${s.current.opts.map(n => `<button onclick="seqAnswer(${n})" class="p-4 rounded-xl font-bold text-lg text-main" style="background:var(--secondary-bg)">${n}</button>`).join('')}
    </div></div>`)
}

window.seqAnswer = function(n) {
  const s = brainState.sequence
  if (n === s.current.ans) { s.score++; playTone(523) } else playTone(200)
  s.round++
  if (s.round >= s.total) s.finished = true
  else s.current = genSequence(s.difficulty)
  render()
}

function renderTriviaGame() {
  const t = brainState.trivia
  if (t.loading) return brainWrapper(`<div class="text-center py-8"><p class="text-muted">Cargando preguntas…</p></div>`)
  if (!t.questions?.length) return brainWrapper(`${emptyState({
    icon: '📡',
    title: 'Sin conexión',
    desc: 'La trivia en vivo necesita internet. Prueba otro ejercicio o vuelve cuando tengas red.',
    ctaLabel: 'Volver a gimnasia',
    ctaOnclick: "brainState.exercise=null;render()",
  })}`)
  if (t.finished) return brainWrapper(`<div class="text-center">
    <p class="text-2xl mb-2">❓</p><p class="font-semibold mb-6">${t.score}/${t.total} correctas</p>
    <button onclick="finishBrain(${t.score * 30})" class="btn-primary">Terminar (+${Math.floor(DIFFICULTIES[t.difficulty].xp * (t.score / t.total))} XP)</button></div>`)
  const q = t.questions[t.round]
  return brainWrapper(`<div>
    <p class="text-xs text-muted mb-1">${esc(q.category)} · ${t.round + 1}/${t.total}</p>
    <p class="font-medium text-main mb-4">${esc(q.question)}</p>
    <div class="space-y-2">
      ${q.options.map((opt, i) => {
        let cls = 'trivia-option w-full p-3 rounded-xl text-left text-sm text-main cursor-pointer'
        if (t.revealed && opt === q.correct) cls += ' correct'
        else if (t.revealed && t.selected === i && opt !== q.correct) cls += ' wrong'
        return `<button onclick="triviaAnswer(${i})" class="${cls}" ${t.revealed ? 'disabled' : ''}>${esc(opt)}</button>`
      }).join('')}
    </div>
    ${t.revealed ? `<button onclick="triviaNext()" class="btn-primary w-full mt-4">${t.round + 1 >= t.total ? 'Ver resultado' : 'Siguiente'}</button>` : ''}
  </div>`)
}

window.triviaAnswer = function(i) {
  const t = brainState.trivia
  if (t.revealed) return
  const q = t.questions[t.round]
  const opt = q.options[i]
  t.selected = i
  t.revealed = true
  if (opt === q.correct) { t.score++; playTone(523) } else playTone(200)
  render()
}

window.triviaNext = function() {
  const t = brainState.trivia
  t.round++
  t.selected = null
  t.revealed = false
  if (t.round >= t.total) t.finished = true
  render()
}

function renderAnagramGame() {
  const a = brainState.anagrams
  if (a.finished) return brainWrapper(`<div class="text-center">
    <p class="text-2xl mb-2">🔤</p><p class="font-semibold mb-6">${a.score}/${a.total} correctos</p>
    <button onclick="finishBrain(${a.score * 25})" class="btn-primary">Terminar (+${Math.floor(DIFFICULTIES[a.difficulty].xp * (a.score / a.total))} XP)</button></div>`)
  const item = a.items[a.round]
  return brainWrapper(`<div class="text-center">
    <p class="text-sm text-muted mb-4">Ronda ${a.round + 1}/${a.total}</p>
    <p class="font-display text-3xl font-bold text-main tracking-widest mb-2">${item.scrambled}</p>
    <p class="text-muted text-sm mb-4">Ordena las letras para formar una palabra</p>
    ${a.showHint ? `<p class="text-xs italic text-muted mb-3">Pista: ${item.hint}</p>` : `<button onclick="anagramHint()" class="btn-ghost text-xs mb-3">💡 Ver pista</button>`}
    <input id="anagram-answer" class="input-field text-center text-lg mb-3 uppercase" placeholder="Tu respuesta" value="${esc(a.answer)}" oninput="brainState.anagrams.answer=this.value.toUpperCase()" onkeydown="if(event.key==='Enter')submitAnagram()">
    ${a.feedback === 'ok' ? '<p class="text-green-600 text-sm mb-2">✓ Correcto</p>' : ''}
    ${a.feedback === 'bad' ? '<p class="text-red-500 text-sm mb-2">✗ Intenta de nuevo</p>' : ''}
    <button onclick="submitAnagram()" class="btn-primary w-full">Comprobar</button>
  </div>`)
}

window.anagramHint = function() { brainState.anagrams.showHint = true; render() }
window.submitAnagram = function() {
  const a = brainState.anagrams
  const item = a.items[a.round]
  const guess = (a.answer || '').trim().toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  const target = item.answer.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  if (guess === target) {
    a.score++; a.feedback = 'ok'; playTone(523)
    setTimeout(() => {
      a.round++; a.answer = ''; a.feedback = null; a.showHint = false
      if (a.round >= a.total) a.finished = true
      render()
    }, 600)
  } else {
    a.feedback = 'bad'; playTone(200); render()
  }
}

function renderLogicGame() {
  const l = brainState.logic
  if (l.finished) return brainWrapper(`<div class="text-center">
    <p class="text-2xl mb-2">🧩</p><p class="font-semibold mb-2">${l.score}/${l.puzzles.length} acertijos</p>
    <p class="text-sm text-muted mb-6">Razonamiento con explicación — no adivinanza a ciegas.</p>
    ${brainFinishBtn(l.score, l.puzzles.length, 'logic', 'Terminar')}</div>`)
  const p = l.puzzles[l.index]
  const answered = l.selected !== null
  const correct = answered && l.selected === p.answer
  return brainWrapper(`<div>
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
  const l = brainState.logic
  if (l.selected !== null) return
  l.selected = i
  const p = l.puzzles[l.index]
  if (i === p.answer) { l.score++; playTone(523) } else playTone(200)
  render()
}

window.logicNext = function() {
  const l = brainState.logic
  l.selected = null
  l.index++
  if (l.index >= l.puzzles.length) l.finished = true
  render()
}

window.openLesson = function(id) {
  if (!isLessonUnlocked(id)) {
    showToast('Esta lección se desbloquea semana a semana en el catálogo', 0, 'mental')
    return
  }
  brainState.activeLesson = id
  brainState.lessonFlow = null
  if (brainState.brainView !== 'school') brainState.brainView = 'academy'
  navigate(`/gimnasia/leccion/${id}`)
}

window.closeLesson = function() {
  brainState.activeLesson = null
  brainState.lessonFlow = null
  navigate('/gimnasia')
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
  brainState.lessonFlow = null
  brainState.activeLesson = null
  checkAndIssueCertificates()
  render()
}

window.completeLessonReview = completeLessonReview

window.setCatalogFilter = function(key, val) {
  brainState.catalogFilter = { ...brainState.catalogFilter, [key]: val }
  render()
}

window.startReviewQuiz = function(id) {
  location.hash = '/gimnasia'
  brainState.brainView = 'school'
  brainState.schoolSection = 'curriculum'
  brainState.reviewFlow = { id, quizIndex: 0, quizScore: 0, phase: 'quiz' }
  brainState.activeLesson = null
  brainState.lessonFlow = null
  render()
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
  render()
}

window.openLibrary = function() {
  location.hash = '/gimnasia'
  brainState.brainView = 'school'
  brainState.schoolSection = 'library'
  brainState.schoolFaculty = null
  brainState.activePaper = null
  brainState.paperMeta = null
  render()
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
  location.hash = '/gimnasia'
  brainState.brainView = brainState.brainView || 'school'
  brainState.activeLesson = id
  brainState.lessonFlow = null
  render(true)
}

window.goToLab = function(id) {
  location.hash = '/gimnasia'
  brainState.brainView = 'lab'
  brainState.activeLesson = null
  brainState.lessonFlow = null
  startBrain(id)
}

window.startLessonPractice = function(exId) {
  brainState.lessonFlow = null
  brainState.activeLesson = null
  brainState.brainView = 'lab'
  startBrain(exId)
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
      m.highlight = m.sequence[i]; render(); playTone(300 + m.sequence[i] * 80, 0.12)
      setTimeout(() => { m.highlight = -1; render(); i++; setTimeout(showNext, cfg.speed / 2) }, cfg.speed)
    } else { m.phase = 'input'; render() }
  }
  setTimeout(showNext, 500)
}

window.memoryClick = function(index) {
  const m = brainState.memory
  if (m.phase !== 'input') return
  m.userInput.push(index); playTone(300 + index * 80, 0.1)
  if (index !== m.sequence[m.userInput.length - 1]) { m.phase = 'failed'; render(); return }
  if (m.userInput.length === m.sequence.length) {
    m.score += m.level * 10; m.level++; m.phase = 'success'; render()
    setTimeout(() => window.memoryStart(), 1000)
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
      s.showing = i; render(); playTone(200 + s.sequence[i] * 50, 0.15)
      setTimeout(() => { s.showing = -1; render(); i++; setTimeout(showNext, speed / 2) }, speed)
    } else { s.phase = 'input'; render() }
  }
  setTimeout(showNext, 500)
}

window.simonClick = function(n) {
  const s = brainState.simon
  if (s.phase !== 'input') return
  s.userInput.push(n); playTone(200 + n * 50, 0.1)
  if (n !== s.sequence[s.userInput.length - 1]) { s.phase = 'failed'; render(); return }
  if (s.userInput.length === s.sequence.length) {
    s.score += s.level * 15; s.level++; s.phase = 'success'; render()
    setTimeout(() => window.simonStart(), 1000)
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

let mathTimer = null
window.mathStart = function() {
  const m = brainState.math
  m.active = true; m.score = 0; m.problem = genMathProblem(m.difficulty); m.answer = ''; m.feedback = null
  if (mathTimer) clearInterval(mathTimer)
  mathTimer = setInterval(() => {
    brainState.math.timeLeft--
    if (brainState.math.timeLeft <= 0) { clearInterval(mathTimer); mathTimer = null; render() }
    else if (!patchLiveUI('/gimnasia')) render()
  }, 1000)
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
  setTimeout(() => { m.feedback = null; render() }, 400)
}

function renderWordsGame() {
  const w = brainState.words
  if (w.finished) return brainWrapper(`<div class="text-center">
    <p class="font-semibold mb-6">${w.score}/${w.total} aciertos</p>
    <button onclick="finishBrain(${w.score * 20})" class="btn-primary">Terminar</button></div>`)
  if (!w.group) w.group = getWordGroup(w.difficulty)
  const shuffled = [...w.group.words].sort(() => Math.random() - 0.5)
  return brainWrapper(`<div class="text-center">
    <p class="text-sm text-muted mb-4">Ronda ${w.round + 1}/${w.total}</p>
    <div class="grid grid-cols-2 gap-3">
      ${shuffled.map(word => {
        let cls = 'habit-item p-4 rounded-xl font-medium w-full'
        let style = ''
        if (w.selected === word) {
          if (word === w.group.odd) cls += ' border-red-400'
          else { cls += ' border-2'; style = 'border-color:var(--primary)' }
        }
        return `<button onclick="wordSelect('${word}')" ${w.selected ? 'disabled' : ''} class="${cls}" style="${style}">${word}</button>`
      }).join('')}
    </div></div>`)
}

window.wordSelect = function(word) {
  const w = brainState.words
  w.selected = word
  if (word !== w.group.odd) w.score++
  render()
  setTimeout(() => {
    w.round++; w.selected = null; w.group = getWordGroup(w.difficulty)
    if (w.round >= w.total) w.finished = true
    render()
  }, 700)
}

export function syncGimnasiaRoute(sub = []) {
  if (sub[0] === 'leccion' && sub[1] && isLessonUnlocked(sub[1])) {
    brainState.activeLesson = sub[1]
    brainState.lessonFlow = null
    brainState.brainView = 'school'
  } else if (sub[0] === 'biblioteca') {
    brainState.brainView = 'school'
    brainState.schoolSection = 'library'
    if (sub[1]) brainState.activePaper = sub[1]
  } else if (sub[0] === 'catalogo') brainState.brainView = 'academy'
  else if (sub[0] === 'laboratorio') brainState.brainView = 'lab'
  else if (sub[0] === 'programa') brainState.brainView = 'program'
}

export function clearEphemeralBrainState() {
  clearBrainTimers()
  brainState.activeLesson = null
  brainState.lessonFlow = null
  brainState.activePaper = null
  brainState.paperMeta = null
  brainState.reviewFlow = null
  brainState.exercise = null
}

export function bindBrainGymGlobals() {
  window.brainState = brainState
  window.startBrain = startBrain
  window.finishBrain = finishBrain
  window.endExerciseBlock = endExerciseBlock
}

export { brainState, renderBrainGym, patchBrainExerciseUI, patchGimnasiaHubUI, startBrain, finishBrain, endExerciseBlock }
