import {
  PREFIX, SKILLS, DIFFICULTIES, getItem, setItem, getToday, esc,
  getProgress, saveProgress, getLevel, getLevelInfo, getTotalLevel, getRank,
  addXp, recordActivity, getStreak, getStats, updateStats,
  getSettings, saveSettings, getHabits, getHabitProgress, completeHabit, uncompleteHabit,
  incrementHabit, decrementHabit, getHabitCount, isHabitComplete, getCompletedHabitsCount,
  setRecord, getAchievements,
  ensureDailyPlan, getPlanProgress, checkPlanTask, isRoutineDoneToday, getWeekNumber,
  GOAL_TEMPLATES, getGoals, addGoal, syncGoals, getHabitWeekChart,
  needsOnboarding, MOODS, getMood, setMood, getMoodWeek, getMoodInsight,
  getStreakShieldStatus,
} from './core.js'
import {
  HABIT_CATEGORIES, HABIT_TEMPLATES,
  WEEKLY_REVIEW_PROMPTS, MONTHLY_REVIEW_PROMPTS, genMathProblem, getMemoryConfig, getSimonConfig,
  getLogicPuzzles, getWordGroup, getAnagrams, COLORS, getReflectionPrompt, pickSequence,
} from './content.js'
import { MEDITATIONS, MEDITATION_STEPS } from './meditations.js'
import {
  UNLOCKS, THEMES, isUnlocked, getUnlocked, getNextUnlock,
  checkNewUnlocks, markUnlockSeen, applyTheme,
} from './unlocks.js'
import {
  getDailyBundle, ensureDailyBundle, buildLocalBundle, homePulseHTML, formatWeather,
  adviceCardHTML, sunsetBannerHTML, readingCardHTML, bundleStatusHTML,
  fetchTriviaQuestions, fetchAnagramWords,
} from './apis.js'
import {
  canUseNotifications, getNotificationPermission, requestNotificationPermission,
  startReminderChecker,
} from './notifications.js'
import {
  COGNITIVE_DOMAINS, EXERCISES, getTodaysSession, getDomainProgress, getProgramStats,
  completeSession, isSessionDoneToday, PROGRAM_DISCLAIMER, getExerciseLevel, updateExerciseLevel,
} from './brain-program.js'
import {
  initNBack, initStroop, initFlanker, initSwitching, initGoNoGo, initCorsi, corsiGenerateSequence,
  initSymbols, flankerArrows, getSwitchAnswer, STROOP_COLORS,
} from './brain-exercises.js'
import { initLayout, setActiveNav, updateSidebarStats, updateTopBanner, applyCompactSidebar } from './layout.js'
import {
  getActivityCalendar, getConsistencyScore, getJourneySummary, getJourneyInsight,
  getHabitTrendWeeks, getMilestones, getNextBestAction, getWeeklySummary, getWeeklyActivityScores,
} from './analytics.js'
import {
  emptyState, milestoneBar, sparklineSVG,
  tabBar, subTabBar, segmentBar, settingGroup, settingRow, pageLead, zoneHeader, pageHero,
} from './ui.js?v=48'
import { celebrate, haptic, updateAppShell } from './fx.js'
import { playTone, playClick, playHabitDone, playSuccess } from './sounds.js'
import {
  bindRender, scheduleRender, navigate, parsePath,
  getLastRenderPath, setLastRenderPath,
} from './router.js'
import { onboarding, renderOnboardingOverlay, resetOnboardingCache } from './onboarding-ui.js'
import { renderHome } from './pages/home.js'
import { getMissionTone, getMissionChip } from './coaching.js'
import {
  getDailyLesson, getWeeklyLesson, getWeeklyLessonMeta, LESSONS, LAB_EXERCISE_IDS, EXERCISE_REAL_WORLD,
  renderLessonCard, renderLessonFull, renderNeuroPunchBanner, renderDebateBanner, renderLegendaryHall,
  renderHomeNeuroCard, renderLessonPostFlow, getLessonQuiz, markLessonComplete, getCompletedLessons,
  getSessionDebrief, isLessonUnlocked, getUnlockedLessonCount, isLegendaryLesson,
} from './brain-academy.js'
import { startTour, shouldShowTour } from './tour.js'
import { exportMonthlyReportText, maybeAutoBackup } from './backup.js'
import {
  initCloudSync, getCloudStatus, signIn, signUp, signOut,
  pullFromCloud, pushToCloud, onCloudStatus,
} from './cloud-sync.js'
import {
  playSingingBowl, startAmbientSound, stopAmbientSound, setAmbientVolume, resumeAudioContext,
  isAmbientPlaying, AMBIENT_PRESETS,
} from './ambient-audio.js'

// --- State ---
let brainState = {
  exercise: null, difficulty: 'medio', mode: 'hub', brainView: 'academy', activeLesson: null, lessonFlow: null,
  session: null, memory: {}, math: {}, words: {}, simon: {}, logic: {}, anagrams: {}, trivia: {},
  nback: {}, stroop: {}, flanker: {}, switching: {}, gonogo: {}, corsi: {}, symbols: {},
}
let brainTimers = []
function clearBrainTimers() { brainTimers.forEach(t => clearTimeout(t)); brainTimers = [] }
let deferredInstallPrompt = null
let dailyApis = getDailyBundle()
let dailyApisLoading = false
let medState = {
  session: null, difficulty: 'medio', completed: false, completedMin: 0,
  phase: 'inhale', elapsed: 0, step: 0, stepElapsed: 0, ambientPreview: false,
}
let medTimers = []
let mejoraTab = 'habits'
let diarioSection = 'daily'
let pomodoro = { minutes: 25, seconds: 0, active: false, mode: 'work' }
let pomodoroTimer = null
let routineState = { active: false, step: 0, difficulty: 'medio' }
let routineTimers = []
let settingsTab = 'general'
let viajeTab = 'resumen'
let metasTab = 'activas'
let profileTab = 'resumen'
let editingHabits = false
let logicSession = { puzzles: [], index: 0, score: 0, difficulty: 'medio', finished: false, selected: null }
function renderHomePage() {
  return renderHome({ moodPickerHTML, dailyApis, dailyApisLoading })
}

function ensureToastContainer() {
  let el = document.getElementById('toast-container')
  if (!el) {
    el = document.createElement('div')
    el.id = 'toast-container'
    document.body.appendChild(el)
  }
  return el
}

function showToast(message, xp, skill, levelUp = false) {
  const container = ensureToastContainer()
  const el = document.createElement('div')
  el.className = 'xp-toast' + (levelUp ? ' xp-toast-level' : '')
  const skillInfo = SKILLS[skill] || { icon: '⭐' }
  el.innerHTML = levelUp
    ? `<span class="toast-icon">🎉</span><div><strong>¡Nivel ${message}!</strong><p class="text-sm opacity-80">${skillInfo.name} · +${xp} XP</p></div>`
    : `<span class="toast-icon">${skillInfo.icon}</span><div><strong>+${xp} XP</strong><p class="text-sm opacity-80">${message}</p></div>`
  container.appendChild(el)
  playTone(levelUp ? 660 : 523, levelUp ? 0.25 : 0.15)
  setTimeout(() => { el.classList.add('toast-out'); setTimeout(() => el.remove(), 300) }, 2800)
}

function showUnlockToast(unlock) {
  markUnlockSeen(unlock.id)
  const container = ensureToastContainer()
  const el = document.createElement('div')
  el.className = 'xp-toast unlock-toast'
  el.innerHTML = `<span class="toast-icon">${unlock.icon}</span><div><strong>¡Desbloqueado!</strong><p class="text-sm opacity-80">${unlock.name} · ${unlock.desc}</p></div>`
  container.appendChild(el)
  playTone(784, 0.3)
  setTimeout(() => { el.classList.add('toast-out'); setTimeout(() => el.remove(), 4000) }, 3500)
}

function awardXp(skill, amount, message) {
  const prevLevel = getTotalLevel()
  const result = addXp(skill, amount)
  const newLevel = getTotalLevel()
  if (result.levelUp) {
    celebrate('level')
    showToast(result.newLevel, amount, skill, true)
  } else showToast(message, amount, skill)
  checkNewUnlocks(prevLevel, newLevel).forEach(showUnlockToast)
  return result
}

function processPlanAwards(awards) {
  for (const a of awards) {
    if (a.bonus) {
      celebrate()
      showToast('¡Plan del día completo!', a.result.xp, 'discipline')
    } else if (a.task) showToast(a.task.label, a.result.xp, 'discipline')
  }
}

function moodPickerHTML(compact = false) {
  const today = getToday()
  const current = getMood(today)
  const week = getMoodWeek()
  const insight = getMoodInsight()
  const picker = `<div class="mood-picker flex gap-2 ${compact === 'home' ? 'mood-picker--home' : 'justify-between'}">
      ${MOODS.map(m => `<button onclick="pickMood(${m.id})" class="mood-btn ${current?.id === m.id ? 'active' : ''}" title="${m.label}">
        <span class="mood-emoji">${m.emoji}</span>
        <span class="mood-label">${m.label}</span>
      </button>`).join('')}
    </div>`

  if (compact === 'home') {
    return `<div class="home-glass home-mood-panel">
      <p class="home-mood-label">Ánimo de hoy</p>
      ${picker}
    </div>`
  }

  return `<div class="card mood-card ${compact ? 'mb-4' : 'mb-6'}">
    <div class="flex justify-between items-center mb-3">
      <h3 class="font-semibold text-main ${compact ? 'text-sm' : ''}">${compact ? '¿Cómo te sientes?' : 'Estado de ánimo'}</h3>
      ${current ? `<span class="text-sm text-muted">${current.emoji} ${current.label}</span>` : '<span class="text-xs text-muted">Sin registrar</span>'}
    </div>
    ${picker}
    ${!compact ? `<div class="mood-week flex justify-between mt-4 pt-4" style="border-top:1px solid var(--border)">
      ${week.map(d => `<div class="text-center flex-1">
        <span class="text-lg">${d.mood?.emoji || '·'}</span>
        <p class="text-xs text-muted mt-1 ${d.isToday ? 'font-bold text-main' : ''}">${d.label}</p>
      </div>`).join('')}
    </div>
    ${insight ? `<p class="text-xs text-muted mt-3 italic">${insight}</p>` : ''}` : ''}
  </div>`
}

function habitChartHTML(compact = false, home = false) {
  const chart = getHabitWeekChart()
  const maxH = compact ? 80 : 120
  const wrapClass = home ? 'home-glass home-panel' : (compact ? '' : 'card card-static home-panel')
  return `<div class="${wrapClass}">
    <div class="flex justify-between items-center mb-4">
      <h3 class="home-panel-title" style="margin:0">${compact ? 'Hábitos esta semana' : 'Hábitos esta semana'}</h3>
      <span class="text-sm text-muted">Promedio: ${chart.avg}%</span>
    </div>
    <div class="habit-chart flex items-end justify-between gap-2" style="height:${maxH}px">
      ${chart.days.map(d => {
        const h = Math.max(4, (d.percent / 100) * maxH)
        return `<div class="flex-1 flex flex-col items-center gap-1 h-full justify-end">
          <span class="text-muted" style="font-size:10px">${d.count}/${d.total}</span>
          <div class="chart-bar w-full rounded-t-lg transition-all ${d.isToday ? 'chart-bar-today' : ''}" style="height:${h}px" title="${d.percent}%"></div>
          <span class="text-xs text-muted ${d.isToday ? 'font-bold text-main' : ''}">${d.label}</span>
        </div>`
      }).join('')}
    </div>
  </div>`
}

function xpBar(info, color) {
  return `<div class="mb-1 flex justify-between text-xs text-muted"><span>Nivel ${info.level}</span><span>${info.xp} XP</span></div>
    <div class="progress-track w-full" style="height:0.5rem">
      <div class="progress-fill h-full" style="width:${info.percent}%;background:${color === 'var(--primary)' ? 'var(--gradient-hero)' : color}"></div>
    </div>`
}

function difficultyPicker(current, onchange) {
  return segmentBar(
    Object.entries(DIFFICULTIES).map(([k, d]) => ({
      id: k,
      label: d.label,
      icon: d.icon,
      locked: k === 'experto' && !isUnlocked('diff_expert'),
      lockTitle: 'Desbloquea en nivel 10',
      lockLabel: '(Nv.10)',
    })),
    current,
    onchange,
  )
}

function guardDifficulty(d) {
  return d === 'experto' && !isUnlocked('diff_expert') ? 'medio' : d
}

async function loadDailyApis(force = false) {
  const country = getSettings().country || 'MX'
  if (!force && dailyApis?.date === getToday() && dailyApis?.country === country && !dailyApis.stale) return
  dailyApisLoading = true
  const path = location.hash.slice(1) || '/'
  if (['/', '/plan', '/mejora', '/meditacion'].includes(path)) render()
  try {
    dailyApis = await ensureDailyBundle(country)
  } catch {
    dailyApis = getDailyBundle() || buildLocalBundle(country)
  }
  dailyApisLoading = false
  const p = location.hash.slice(1) || '/'
  if (['/', '/plan', '/mejora', '/meditacion'].includes(p)) render()
}

function playerCard() {
  const rank = getRank()
  const total = getTotalLevel()
  const p = getProgress()
  const totalXp = Object.values(p.xp).reduce((a, b) => a + b, 0)
  const info = getLevelInfo(totalXp)
  return `<div class="card mb-6">
    <div class="flex items-center gap-4 mb-4">
      <div class="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl player-avatar">${rank.icon}</div>
      <div class="flex-1">
        <p class="text-sm text-muted">${rank.title} · Nivel ${total}</p>
        <p class="font-display text-xl font-bold text-main">${totalXp} XP total</p>
      </div>
      <a href="#/perfil" class="text-muted no-underline text-sm">Ver perfil →</a>
    </div>
    ${xpBar(info, 'var(--primary)')}
  </div>`
}

function skillBars() {
  const p = getProgress()
  return Object.entries(SKILLS).map(([key, skill]) => {
    const info = getLevelInfo(p.xp[key] || 0)
    return `<div class="mb-4">
      <div class="flex items-center gap-2 mb-1"><span>${skill.icon}</span><span class="text-sm font-medium text-main">${skill.name}</span><span class="text-xs text-muted ml-auto">Nv. ${info.level}</span></div>
      ${xpBar(info, skill.color)}
    </div>`
  }).join('')
}

function heatmapHTML(days = 28) {
  const cal = getActivityCalendar(days)
  return `<div class="heatmap-grid">${cal.map(d =>
    `<div class="heatmap-cell ${d.level ? `l${d.level}` : ''} ${d.isToday ? 'today' : ''}" title="${d.date}: ${d.count} actividades"></div>`
  ).join('')}</div>`
}

// --- Solo hoy (minimal) ---
function renderSoloHoy() {
  const progress = getPlanProgress()
  const action = getNextBestAction()
  const habits = getHabits().filter(h => !isHabitComplete(h)).slice(0, 3)

  return `<div class="animate-fade-in route-enter page-shell page-wide page-solo-hoy">
    <a href="#/" class="btn-secondary focus-exit no-underline">← Salir</a>
    <div class="ds-page ds-page--full solo-dashboard">
    ${pageHero('Solo hoy', 'Una cosa a la vez, sin ruido', `${progress.percent}%`, 'plan del día')}
    <div class="ds-panel ds-panel--flat text-center solo-focus">
      <p class="text-xs text-muted uppercase tracking-wide mb-2">Modo enfoque</p>
      <p class="font-display text-3xl font-bold text-main">${progress.percent}%</p>
      <p class="text-sm text-muted">Plan del día · ${progress.done}/${progress.total}</p>
      <div class="progress-track w-full mt-3" style="height:8px">
        <div class="progress-fill h-full" style="width:${progress.percent}%"></div>
      </div>
      <div class="grid grid-cols-2 gap-2 mt-4">
        <a href="#/rutina" class="btn-secondary text-center no-underline py-3">⚔️ Express</a>
        <a href="#/" class="btn-ghost text-center no-underline py-3">Vista completa</a>
      </div>
    </div>

    <a href="${action.link}" class="ds-list-item next-action no-underline solo-action">
      <span class="ds-list-icon">${action.icon}</span>
      <div class="ds-list-body">
        <p class="ds-list-meta" style="margin:0">Ahora</p>
        <p class="ds-list-title">${action.title}</p>
        <p class="ds-list-meta">${action.desc}</p>
      </div>
      <span class="text-muted">→</span>
    </a>

    ${habits.length ? `<div class="ds-panel ds-panel--flat solo-habits">
      <h3 class="section-title" style="margin:0 0 0.75rem">Hábitos pendientes</h3>
      <div class="space-y-2">
        ${habits.map(h => `<a href="#/mejora" class="flex items-center gap-2 p-2 rounded-lg no-underline habit-item">
          <span>${h.icon}</span><span class="text-main text-sm flex-1">${esc(h.name)}</span><span class="text-muted text-xs">→</span>
        </a>`).join('')}
      </div>
    </div>` : `<div class="card card-static solo-habits solo-habits--done">
      <p class="text-main font-medium mb-1">✅ Hábitos al día</p>
      <p class="text-sm text-muted mb-3">Si tienes 3 minutos, una reflexión corta cerraría el día con intención.</p>
      <a href="#/mejora/diario" onclick="mejoraTab='diario';diarioSection='daily';render(true)" class="btn-secondary text-sm no-underline">Abrir diario →</a>
    </div>`}
    </div>
  </div>`
}

// --- Mi viaje (largo plazo) ---
function renderViaje() {
  const s = getJourneySummary()
  const insight = getJourneyInsight()
  const trends = getHabitTrendWeeks(4)
  const trends12 = getHabitTrendWeeks(12)
  const activity12 = getWeeklyActivityScores(12)
  const weekly = getWeeklySummary()
  const milestones = getMilestones()
  const domains = getDomainProgress()
  const maxTrend = Math.max(...trends.map(t => t.percent), 1)
  const max12 = Math.max(...trends12.map(t => t.percent), 1)

  const since = new Date(s.firstActivity + 'T12:00:00').toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' })
  const viajeTabs = tabBar([
    { id: 'resumen', label: 'Resumen', icon: '📊' },
    { id: 'actividad', label: 'Actividad', icon: '📈' },
    { id: 'hitos', label: 'Hitos', icon: '🏆' },
  ], viajeTab, 'viajeTab')

  const resumenBlock = `
    <div class="viaje-kpi-grid">
      <div class="viaje-kpi"><span class="viaje-kpi-val">${s.streak}</span><span class="viaje-kpi-label">🔥 Racha</span></div>
      <div class="viaje-kpi"><span class="viaje-kpi-val">${s.consistency30}%</span><span class="viaje-kpi-label">Consistencia</span></div>
      <div class="viaje-kpi"><span class="viaje-kpi-val">${s.habitsCompleted}</span><span class="viaje-kpi-label">Hábitos</span></div>
      <div class="viaje-kpi"><span class="viaje-kpi-val">${s.brainSessions}</span><span class="viaje-kpi-label">Sesiones mente</span></div>
    </div>
    <div class="card card-static weekly-summary-card viaje-weekly">
      <h3 class="section-title">Resumen semanal</h3>
      <p class="text-sm text-main leading-relaxed mb-3">${weekly.narrative}</p>
      <div class="weekly-summary-stats">
        <span class="weekly-pill">${weekly.activeDays}/7 días activos</span>
        <span class="weekly-pill">${weekly.habitDays} días con hábitos</span>
        ${weekly.moodAvg ? `<span class="weekly-pill">Ánimo ${weekly.moodAvg}/4</span>` : ''}
      </div>
    </div>

    <div class="viaje-side">
      <div class="card card-static text-center py-6 viaje-consistency">
        <div class="consistency-ring" style="--pct:${s.consistency30}">
          <span>${s.consistency30}%</span>
          <small>consistencia</small>
        </div>
        <p class="text-sm text-muted mt-4">${s.activeDays30} de 30 días activos</p>
      </div>
      <div class="card card-static viaje-summary">
        <h3 class="font-semibold text-main mb-3">Resumen total</h3>
        <div class="space-y-2 text-sm">
          <div class="flex justify-between"><span class="text-muted">🔥 Racha actual</span><span class="text-main font-medium">${s.streak} días</span></div>
          <div class="flex justify-between"><span class="text-muted">🧠 Sesiones cerebrales</span><span class="text-main font-medium">${s.brainSessions}</span></div>
          <div class="flex justify-between"><span class="text-muted">✅ Hábitos completados</span><span class="text-main font-medium">${s.habitsCompleted}</span></div>
          <div class="flex justify-between"><span class="text-muted">📝 Reflexiones</span><span class="text-main font-medium">${s.reflections}</span></div>
          <div class="flex justify-between"><span class="text-muted">🎯 Metas logradas</span><span class="text-main font-medium">${s.goalsCompleted}</span></div>
        </div>
      </div>
    </div>

    <div class="card card-static viaje-insight">
      <h3 class="section-title">Insight personalizado</h3>
      <p class="text-sm text-main leading-relaxed">${insight}</p>
    </div>

    <div class="viaje-actions flex gap-2 flex-wrap span-full">
      <button onclick="exportMonthlyReportText()" class="btn-secondary flex-1">📄 Informe mensual</button>
      <a href="#/ajustes" onclick="settingsTab='data';setTimeout(render,0)" class="btn-ghost flex-1 text-center no-underline">Respaldo →</a>
    </div>`

  const actividadBlock = `
    <div class="card card-static viaje-heatmap">
      <h3 class="section-title">Mapa de actividad (35 días)</h3>
      ${heatmapHTML(35)}
    </div>

    <div class="card card-static viaje-trends-habits">
      <h3 class="section-title">Tendencia de hábitos (12 semanas)</h3>
      ${sparklineSVG(trends12.map(t => t.percent))}
      <div class="trend-bars mt-4">
        ${trends12.map((t, i) => `
          <div class="trend-bar-wrap">
            <div class="trend-bar" style="height:${Math.max(4, (t.percent / max12) * 100)}%"></div>
            <span class="trend-bar-label">${i + 1}</span>
          </div>`).join('')}
      </div>
      <p class="text-xs text-muted mt-3 text-center">Promedio semanal · números = semanas</p>
    </div>

    <div class="card card-static viaje-trends-activity">
      <h3 class="section-title">Actividad (12 semanas)</h3>
      ${sparklineSVG(activity12.map(a => a.score), 'var(--cyan)')}
      <p class="text-xs text-muted mt-3 text-center">Total de actividades registradas por semana</p>
    </div>

    <div class="card card-static viaje-domains">
      <h3 class="section-title">Dominios cognitivos</h3>
      <div class="space-y-3">
        ${domains.map(d => `
          <div>
            <div class="flex justify-between text-sm mb-1">
              <span>${d.icon} ${d.name}</span>
              <span class="text-muted">Nv. ${d.level}</span>
            </div>
            <div class="progress-track w-full" style="height:4px">
              <div class="progress-fill h-full" style="width:${d.xp % 100}%;background:${d.color}"></div>
            </div>
          </div>`).join('')}
      </div>
      <a href="#/gimnasia" class="btn-secondary w-full mt-4 block text-center no-underline">Ir a gimnasia →</a>
    </div>`

  const hitosBlock = `
    <div class="viaje-milestones span-full">
      <h3 class="section-title">Hitos del viaje</h3>
      <div class="milestone-grid">
        ${milestones.map(m => `
          <div class="milestone-item ${m.done ? 'done' : ''}">
            <span class="mi-icon">${m.done ? m.icon : '🔒'}</span>
            ${m.label}
          </div>`).join('')}
      </div>
    </div>`

  const tabContent = viajeTab === 'resumen' ? resumenBlock
    : viajeTab === 'actividad' ? actividadBlock
    : hitosBlock

  return `<div class="animate-fade-in page-shell page-viaje route-enter">
    <div class="ds-page ds-page--full">
    ${pageHero('Mi viaje', `Día ${s.daysSinceStart} de tu camino · desde ${since}`, `${s.consistency30}%`, 'consistencia 30d')}
    ${viajeTabs}
    <div class="viaje-dashboard">${tabContent}</div>
    </div>
  </div>`
}

// --- Plan del día ---
function renderPlan() {
  processPlanAwards(checkPlanTask('plan_review'))
  processPlanAwards(checkPlanTask('morning'))
  const plan = ensureDailyPlan()
  const progress = getPlanProgress()
  const p = getProgress()
  const week = getWeekNumber()
  if (p.weekly.week !== week) { p.weekly = { week, done: 0, target: 5, rewarded: false }; saveProgress(p) }
  const weeklyPct = Math.min(100, (p.weekly.done / p.weekly.target) * 100)

  const holidayMsg = dailyApis?.holiday?.isHoliday
    ? `🎉 Hoy es ${esc(dailyApis.holiday.name)} — prioriza lo esencial`
    : 'Tu hoja de ruta para hoy'

  const statusBadge = bundleStatusHTML(dailyApis)

  return `<div class="animate-fade-in page-shell page-plan">
    <div class="ds-page ds-page--full">
    ${pageHero('Plan del día', `${holidayMsg}${statusBadge ? ` · ${statusBadge}` : ''}`, `${progress.done}/${progress.total}`, 'pendientes')}

    <div class="plan-dashboard">
    <div class="ds-panel ds-panel--flat plan-progress">
      <div class="flex justify-between items-center mb-2">
        <span class="text-sm font-medium text-main">${progress.done}/${progress.total} misiones</span>
        <span class="text-sm text-muted">${progress.percent}%</span>
      </div>
      <div class="progress-track w-full mb-2" style="height:0.75rem">
        <div class="progress-fill h-full" style="width:${progress.percent}%"></div>
      </div>
      ${progress.allDone
        ? `<p class="text-center text-main font-medium">🎉 ¡Plan completo! +${plan.bonusXp} XP bonus</p>`
        : `<p class="text-center text-sm text-muted">Completa todo para +${plan.bonusXp} XP extra</p>`}
    </div>

    <div class="plan-missions ds-list">
      ${plan.tasks.map(t => {
        const tone = getMissionTone(t)
        return `
        <a href="${t.link}" class="ds-list-item plan-mission-item mission--${tone} ${t.done ? 'is-done' : ''} no-underline">
          <span class="ds-list-icon">${t.done ? '✅' : t.icon}</span>
          <div class="ds-list-body">
            <span class="mission-chip">${getMissionChip(tone)}</span>
            <p class="ds-list-title">${t.label}</p>
            ${t.brief ? `<p class="plan-mission-brief">${t.brief}</p>` : ''}
            <p class="ds-list-meta">${t.why || `+${t.xp} XP`}</p>
          </div>
          <span class="mission-xp">+${t.xp}</span>
          ${!t.done ? '<span class="text-muted">→</span>' : ''}
        </a>`
      }).join('')}
    </div>

    <div class="plan-side">
      ${!isRoutineDoneToday() ? `<div class="card plan-express" style="border:2px dashed var(--border)">
        <h3 class="font-semibold text-main mb-2">⏱️ Modo Express (5 min)</h3>
        <p class="text-sm text-muted mb-4">¿Poco tiempo? Rutina corta: 1 min respiración + 3 cálculos.</p>
        <button onclick="startExpress()" class="btn-secondary w-full">Iniciar express</button>
      </div>` : ''}

      <div class="card plan-weekly">
        <h3 class="font-semibold text-main mb-2">📅 Misión semanal</h3>
        <p class="text-sm text-muted mb-3">Activo ${p.weekly.target} de 7 días → +200 XP</p>
        <div class="w-full h-2 rounded-full" style="background:var(--secondary-bg)">
          <div class="h-2 rounded-full" style="width:${weeklyPct}%;background:var(--primary)"></div>
        </div>
        <p class="text-xs text-muted mt-2">${p.weekly.done}/${p.weekly.target} días</p>
      </div>

      ${sunsetBannerHTML(dailyApis?.sun)}
    </div>

    <div class="plan-chart">${habitChartHTML()}</div>
    </div>
    </div>
  </div>`
}

// --- Metas ---
function renderMetas() {
  syncGoals()
  const goals = getGoals()
  const active = goals.filter(g => g.active)
  const completed = goals.filter(g => g.completed)
  const failed = goals.filter(g => g.failed)

  const metasTabs = tabBar([
    { id: 'activas', label: `Activas (${active.length}/3)`, icon: '🎯' },
    { id: 'plantillas', label: 'Nueva', icon: '➕' },
    { id: 'historial', label: 'Historial', icon: '📜' },
  ], metasTab, 'metasTab')

  let tabContent = ''
  if (metasTab === 'activas') {
    tabContent = !active.length ? emptyState({
      iconKey: 'goal',
      title: 'Sin metas activas',
      desc: 'Elige una plantilla en la pestaña Nueva para darle dirección a tu progreso.',
      ctaLabel: 'Ver plantillas',
      ctaOnclick: "metasTab='plantillas';render()",
    }) : `<div class="metas-active-grid">
      ${active.map(g => {
        const daysLeft = Math.max(0, Math.ceil((new Date(g.endDate) - new Date()) / 86400000))
        return `<div class="card">
          <div class="flex items-center gap-3 mb-3">
            <span class="text-2xl">${g.icon}</span>
            <div class="flex-1"><p class="font-medium text-main">${g.title}</p>
            <p class="text-xs text-muted">Hasta ${new Date(g.endDate).toLocaleDateString('es')} · ${daysLeft} días</p></div>
          </div>
          ${milestoneBar(g.progress, g.target, g.milestonesHit || [])}
          <p class="text-sm text-muted mt-2">${g.progress} / ${g.target} · Hitos 25/50/75% · +150 XP al completar</p>
        </div>`
      }).join('')}
    </div>`
  } else if (metasTab === 'plantillas') {
    tabContent = active.length >= 3
      ? '<p class="text-muted text-sm text-center py-8">Máximo 3 metas activas. Completa una para agregar otra.</p>'
      : `<div class="metas-templates-grid">
        ${GOAL_TEMPLATES.map((t, i) => `
          <button onclick="pickGoal(${i})" class="card text-left w-full cursor-pointer goal-template-card">
            <div class="flex items-start gap-3">
              <span class="text-2xl">${t.icon}</span>
              <div class="flex-1">
                <p class="font-medium text-main">${t.title}</p>
                <p class="text-sm text-muted mt-1">${t.pitch || ''}</p>
                <p class="text-xs text-muted mt-2">${t.days} días · Meta: ${t.target} · +150 XP</p>
              </div>
            </div>
          </button>`).join('')}
      </div>`
  } else {
    tabContent = !completed.length && !failed.length
      ? emptyState({
        iconKey: 'journey',
        title: 'Sin historial aún',
        desc: 'Cuando completes o cierres metas, aparecerán aquí.',
      })
      : `${completed.length ? `<p class="ds-section-title">Completadas</p>
        <div class="ds-list mb-6">${completed.map(g => `
          <div class="ds-list-item is-done">
            <span class="ds-list-icon">${g.icon}</span>
            <div class="ds-list-body">
              <p class="ds-list-title">${g.title}</p>
              <p class="ds-list-meta">${g.progress}/${g.target} · +150 XP</p>
            </div>
            <span class="ds-chip ds-chip--accent">🏆</span>
          </div>`).join('')}
        </div>` : ''}
        ${failed.length ? `<p class="ds-section-title">No completadas</p>
        <div class="ds-list">${failed.map(g => `
          <div class="ds-list-item is-done">
            <span class="ds-list-icon">${g.icon}</span>
            <div class="ds-list-body">
              <p class="ds-list-title">${g.title}</p>
              <p class="ds-list-meta">Meta no alcanzada</p>
            </div>
          </div>`).join('')}
        </div>` : ''}`
  }

  return `<div class="animate-fade-in route-enter page-shell page-wide page-metas">
    <div class="ds-page ds-page--full">
      ${pageHero('Metas', 'Objetivos a 30-90 días con hitos en 25%, 50% y 75%', active.length, 'activas')}
      ${metasTabs}
      <div class="ds-panel ds-panel--flat">${tabContent}</div>
    </div>
  </div>`
}

window.pickGoal = function(index) {
  if (addGoal(GOAL_TEMPLATES[index])) {
    showToast('Meta activada', 0, 'discipline')
    render()
  }
}

// --- Profile ---
function renderProfile() {
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
          ['Meditación', stats.meditationMinutes + ' min'], ['Reflexiones', stats.reflections],
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

// --- Routine ---
const ROUTINE_STROOP_INK = [
  { key: 'rojo', label: 'Rojo', name: 'ROJO', css: '#ef4444' },
  { key: 'azul', label: 'Azul', name: 'AZUL', css: '#3b82f6' },
  { key: 'verde', label: 'Verde', name: 'VERDE', css: '#22c55e' },
]

function genRoutineStroop() {
  const ink = ROUTINE_STROOP_INK[Math.floor(Math.random() * ROUTINE_STROOP_INK.length)]
  let word = ROUTINE_STROOP_INK[Math.floor(Math.random() * ROUTINE_STROOP_INK.length)]
  while (word.key === ink.key) word = ROUTINE_STROOP_INK[Math.floor(Math.random() * ROUTINE_STROOP_INK.length)]
  return { ink, word }
}

function clearRoutineTimers() { routineTimers.forEach(t => clearInterval(t)); routineTimers = [] }

function startRoutine() {
  if (isRoutineDoneToday()) return
  const diff = routineState.difficulty || getSettings().defaultDifficulty
  const d = DIFFICULTIES[diff]
  clearRoutineTimers()
  routineState = {
    active: true, step: 1, difficulty: diff,
    breathing: { elapsed: 0, phase: 'inhale', total: diff === 'experto' ? 180 : diff === 'dificil' ? 150 : 120 },
    brain: { round: 0, total: 5, score: 0, trial: genRoutineStroop(), feedback: null },
  }
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
  render()
}

function finishRoutine(express = false) {
  clearRoutineTimers()
  recordActivity('routine')
  const xp = express ? 30 : (DIFFICULTIES[routineState.difficulty]?.xp || 50)
  awardXp('mindfulness', Math.floor(xp * 0.4), 'Rutina completada')
  awardXp('mental', Math.floor(xp * 0.3), 'Mente activa')
  awardXp('wisdom', Math.floor(xp * 0.3), 'Reflexión')
  updateStats({ routinesCompleted: getStats().routinesCompleted + 1 })
  processPlanAwards(checkPlanTask(express ? 'express' : 'routine'))
  routineState = { active: false, step: 4, difficulty: routineState.difficulty, express }
  render()
}

window.startExpress = function() {
  if (isRoutineDoneToday()) return
  clearRoutineTimers()
  const diff = 'facil'
  routineState = {
    active: true, step: 1, difficulty: diff, express: true,
    breathing: { elapsed: 0, phase: 'inhale', total: 60 },
    brain: { round: 0, total: 5, score: 0, trial: genRoutineStroop(), feedback: null },
  }
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
  location.hash = '/rutina'
  render()
}

function renderRoutine() {
  if (!routineState.active && routineState.step !== 4) {
    if (isRoutineDoneToday()) return `<div class="animate-fade-in text-center page-shell page-wide page-routine"><div class="card span-full">
      <p class="text-4xl mb-4">✨</p><h2 class="font-display text-2xl font-bold text-main mb-2">Rutina completada</h2>
      <p class="text-muted mb-6">Vuelve mañana para más XP.</p><a href="#/plan" class="btn-primary inline-block no-underline">Ver plan</a></div></div>`
    return `<div class="animate-fade-in page-shell page-wide page-routine">
      <div class="ds-page ds-page--full">
      ${pageLead('Respiración + Stroop rápido + reflexión · protocolos con evidencia')}
      <div class="page-dashboard routine-intro-grid">
        <div class="routine-intro-main ds-panel ds-panel--flat">
          <p class="ds-section-title">Dificultad</p>
          ${difficultyPicker(routineState.difficulty || getSettings().defaultDifficulty, 'setRoutineDiff')}
        </div>
        <div class="ds-panel ds-panel--flat space-y-3 text-left routine-intro-steps">
          <div class="flex gap-3"><span>🌬️</span><div><p class="font-medium text-main">Respiración</p><p class="text-xs text-muted">2-3 min según nivel</p></div></div>
          <div class="flex gap-3"><span>🎨</span><div><p class="font-medium text-main">Stroop rápido</p><p class="text-xs text-muted">5 trials · cíngulo anterior</p></div></div>
          <div class="flex gap-3"><span>📝</span><div><p class="font-medium text-main">Reflexión</p><p class="text-xs text-muted">Pregunta según dificultad</p></div></div>
        </div>
        <button onclick="startRoutine()" class="btn-primary w-full text-lg py-4 routine-intro-cta">Comenzar rutina</button>
      </div>
      </div>
    </div>`
  }
  if (routineState.step === 4) {
    const d = DIFFICULTIES[routineState.difficulty]
    return `<div class="animate-fade-in text-center page-shell page-wide"><div class="card level-up">
      <p class="text-4xl mb-4">🎉</p><h2 class="font-display text-2xl font-bold text-main mb-2">¡${routineState.express ? 'Express completado' : 'Rutina completada'}!</h2>
      <p class="text-muted mb-6">${routineState.express ? '5 minutos bien invertidos' : `Modo ${d?.label || 'Medio'}`}</p>
      <a href="#/plan" class="btn-primary inline-block no-underline">Ver plan del día</a></div></div>`
  }

  const steps = routineState.express ? ['Respirar', 'Stroop'] : ['Respirar', 'Stroop', 'Reflexionar']
  const stepHtml = `<div class="step-indicator span-full">${steps.map((_, i) =>
    `<div class="step-dot ${i + 1 < routineState.step ? 'done' : i + 1 === routineState.step ? 'current' : ''}"></div>`
  ).join('')}</div>`

  if (routineState.step === 1) {
    const b = routineState.breathing
    const scale = b.phase === 'inhale' ? 1.15 : b.phase === 'exhale' ? 0.85 : 1.05
    const phase = { inhale: 'Inhala', hold: 'Mantén', exhale: 'Exhala' }
    return `<div class="page-shell page-wide page-routine">
      <button onclick="routineState.active=false;routineState.step=0;clearRoutineTimers();location.hash='/rutina';render()" class="btn-secondary focus-exit">← Salir</button>
      <div class="routine-active-grid">${stepHtml}
        <div class="routine-active-side card card-static">
          <p class="text-sm text-muted mb-2">Fase 1 · Respiración</p>
          <p class="text-main font-medium">${DIFFICULTIES[routineState.difficulty].icon} ${DIFFICULTIES[routineState.difficulty].label}</p>
          <p id="routine-remaining" class="text-xs text-muted mt-3">${b.total - b.elapsed}s restantes</p>
        </div>
        <div class="routine-stage card card-static">
          <div class="relative w-44 h-44 mx-auto">
            <div id="routine-breathe-circle" class="absolute inset-0 rounded-full breathe-circle meditation-ring" style="transform:scale(${scale});transition:transform 4s"></div>
            <div class="absolute inset-0 flex items-center justify-center"><span id="routine-phase-text" class="font-display text-2xl meditation-text">${phase[b.phase]}</span></div>
          </div>
        </div>
      </div></div>`
  }
  if (routineState.step === 2) {
    const br = routineState.brain
    const t = br.trial
    return `<div class="animate-fade-in page-shell page-wide page-routine">
      <button onclick="routineState.active=false;routineState.step=0;clearRoutineTimers();location.hash='/rutina';render()" class="btn-secondary focus-exit">← Salir</button>
      <div class="routine-active-grid">${stepHtml}
        <div class="routine-active-side card card-static">
          <p class="text-sm text-muted mb-2">Fase 2 · Stroop</p>
          <p class="text-main font-medium">Trial ${br.round + 1} de ${br.total}</p>
          <p class="text-xs text-muted mt-2">Nombra el color de la tinta, no la palabra.</p>
        </div>
        <div class="card text-center exercise-stage">
          <p class="font-display text-4xl font-bold mb-6" style="color:${t.ink.css}">${t.word.name}</p>
          <div class="flex flex-col gap-2">
            ${ROUTINE_STROOP_INK.map(c => `
              <button type="button" onclick="routineStroopPick('${c.key}')" class="btn-secondary w-full">${c.label}</button>`).join('')}
          </div>
          ${br.feedback === 'correct' ? '<p class="text-green-500 mt-3">✓ Cíngulo + PFC</p>' : ''}
          ${br.feedback === 'wrong' ? `<p class="text-red-400 mt-3">✗ Era ${t.ink.label}</p>` : ''}
        </div>
      </div></div>`
  }
  if (routineState.step === 3) {
    const prompt = getReflectionPrompt(routineState.difficulty)
    return `<div class="animate-fade-in page-shell page-wide page-routine">
      <button onclick="routineState.active=false;routineState.step=0;clearRoutineTimers();location.hash='/rutina';render()" class="btn-secondary focus-exit">← Salir</button>
      <div class="routine-active-grid">${stepHtml}
        <div class="routine-active-side card card-static">
          <p class="text-sm text-muted mb-2">Fase 3 · Reflexión</p>
          <p class="text-main text-sm italic">"${prompt}"</p>
        </div>
        <div class="card exercise-stage">
          <h3 class="font-display text-lg font-semibold text-main mb-2">Tu reflexión</h3>
          <textarea id="routine-reflection" class="input-field min-h-32 resize-none mb-4" placeholder="Mínimo 20 caracteres..."></textarea>
          <button onclick="routineFinishReflection('${esc(prompt)}')" class="btn-primary w-full">Completar rutina</button>
        </div>
      </div></div>`
  }
}

window.setRoutineDiff = (d) => { routineState.difficulty = guardDifficulty(d); render() }
window.routineStroopPick = function(key) {
  const br = routineState.brain
  if (br.feedback) return
  if (key === br.trial.ink.key) { br.score++; br.feedback = 'correct'; playTone(523) }
  else { br.feedback = 'wrong'; playTone(200) }
  br.round++
  render()
  setTimeout(() => {
    br.feedback = null
    if (br.round >= br.total) {
      if (routineState.express) finishRoutine(true)
      else routineState.step = 3
    } else br.trial = genRoutineStroop()
    render()
  }, 700)
}
window.routineFinishReflection = function(prompt) {
  const text = document.getElementById('routine-reflection')?.value?.trim()
  if (!text || text.length < 20) { alert('Escribe al menos 20 caracteres.'); return }
  const entries = getItem('reflections', [])
  entries.unshift({ id: Date.now(), date: new Date().toISOString(), prompt, text, difficulty: routineState.difficulty })
  setItem('reflections', entries)
  updateStats({ reflections: getStats().reflections + 1 })
  processPlanAwards(checkPlanTask('reflection'))
  finishRoutine(routineState.express)
}

// --- Brain Gym (programa neurociencia + academia) ---
function getLabExercises() {
  return LAB_EXERCISE_IDS.map(id => EXERCISES[id]).filter(Boolean)
}

function renderBrainExercise() {
  const id = brainState.exercise
  if (!LAB_EXERCISE_IDS.includes(id)) {
    brainState.exercise = null
    return `<div class="page-shell page-wide"><div class="card text-center p-8">
      <p class="text-muted mb-4">Solo protocolos de laboratorio con respaldo científico.</p>
      <button onclick="brainState.exercise=null;render()" class="btn-primary">Volver al laboratorio</button></div></div>`
  }
  if (id === 'nback') return renderNBackGame()
  if (id === 'stroop') return renderStroopGame()
  if (id === 'flanker') return renderFlankerGame()
  if (id === 'switching') return renderSwitchingGame()
  if (id === 'gonogo') return renderGoNoGoGame()
  if (id === 'corsi') return renderCorsiGame()
  if (id === 'symbols') return renderSymbolsGame()
  return ''
}

function renderBrainGym() {
  if (brainState.session?.phase === 'debrief') return renderSessionDebrief()
  if (brainState.session?.phase === 'intro' && !brainState.exercise) return renderSessionIntro()
  if (brainState.exercise) return renderBrainExercise()

  const stats = getProgramStats()
  const domains = getDomainProgress()
  const todaySession = getTodaysSession()
  const diff = brainState.difficulty
  const d = DIFFICULTIES[diff]

  const brainTabs = tabBar([
    { id: 'academy', label: 'Academia', icon: '🎓' },
    { id: 'lab', label: 'Laboratorio', icon: '🔬' },
    { id: 'program', label: 'Programa', icon: '📋' },
  ], brainState.brainView || 'academy', 'brainState.brainView', 'brainState.activeLesson=null;')

  if (brainState.brainView === 'academy') {
    if (brainState.activeLesson) {
      if (brainState.lessonFlow?.id === brainState.activeLesson) {
        return `<div class="animate-fade-in page-shell page-wide page-brain">
          <div class="ds-page ds-page--full">${renderLessonPostFlow(brainState.lessonFlow)}</div>
        </div>`
      }
      const lesson = LESSONS.find(l => l.id === brainState.activeLesson)
      return `<div class="animate-fade-in page-shell page-wide page-brain">
        <div class="ds-page ds-page--full">${lesson ? renderLessonFull(lesson) : ''}</div>
      </div>`
    }
    const daily = getDailyLesson()
    const weekly = getWeeklyLessonMeta()
    const doneCount = getCompletedLessons().length
    const unlocked = getUnlockedLessonCount()
    return `<div class="animate-fade-in page-shell page-wide page-brain">
      <div class="ds-page ds-page--full">
      ${brainTabs}
      ${pageHero('Neurociencia', '32 lecciones · casos legendarios · laboratorio', `${doneCount}/${unlocked}`, 'leídas')}
      ${renderNeuroPunchBanner()}
      ${renderDebateBanner()}
      ${renderLegendaryHall()}
      <div class="academy-weekly span-full">
        <p class="academy-weekly-label">📅 Semana ${weekly.week} · Lección nueva</p>
        ${renderLessonCard(weekly.lesson, { weekly: true, featured: true })}
        <button type="button" onclick="openLesson('${weekly.lesson.id}')" class="btn-primary w-full mt-3 py-4">
          ${weekly.isNew ? 'Leer lección de la semana →' : 'Releer lección de la semana →'}
        </button>
        <p class="academy-weekly-note">${unlocked}/${LESSONS.length} catálogo · legendarios siempre abiertos · +2/semana</p>
      </div>
      <div class="academy-daily span-full">
        <p class="academy-daily-label">📖 Lectura rápida del día</p>
        ${renderLessonCard(daily, { featured: true })}
        ${isLessonUnlocked(daily.id)
          ? `<button type="button" onclick="openLesson('${daily.id}')" class="btn-secondary w-full mt-3">Leer →</button>`
          : `<p class="text-xs text-muted mt-2 text-center">Esta lectura se desbloquea en el catálogo primero.</p>`}
      </div>
      ${zoneHeader('Catálogo', `${unlocked} de ${LESSONS.length} lecciones · sistemas · memoria · atención · emoción`)}
      <div class="academy-lesson-grid span-full">
        ${LESSONS.map(l => renderLessonCard(l)).join('')}
      </div>
      </div>
    </div>`
  }

  if (brainState.brainView === 'lab') {
    const games = getLabExercises()
    return `<div class="animate-fade-in page-shell page-wide page-brain">
      <div class="ds-page ds-page--full">
      ${brainTabs}
      ${pageHero('Laboratorio', 'Paradigmas cognitivos con respaldo en neuroimagen', games.length, 'protocolos')}
      <p class="ds-lead span-full">N-back, Stroop, Corsi, Flanker… Cada protocolo activa circuitos cerebrales documentados en estudios de laboratorio.</p>
      ${difficultyPicker(diff, 'setBrainDiff')}
      <div class="brain-games-grid span-full">
        ${games.map(ex => {
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
        }).join('')}
      </div>
      </div>
    </div>`
  }

  return `<div class="animate-fade-in page-shell page-brain">
    <div class="ds-page ds-page--full">
    ${brainTabs}
    ${pageHero('Entrenamiento', 'Sesión guiada de paradigmas cognitivos', stats.doneToday ? '✓' : '○', 'sesión hoy')}

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

    </div>
    </div>
  </div>`
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
        <textarea id="session-debrief-text" class="input-field min-h-24 resize-none mt-3" placeholder="Opcional: escribe tu reflexión (10+ caracteres para guardar en el diario)…"></textarea>
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
  const text = document.getElementById('session-debrief-text')?.value?.trim()
  if (text && text.length >= 10 && brainState.session) {
    const debrief = getSessionDebrief(brainState.session.results)
    const entries = getItem('reflections', [])
    entries.unshift({
      id: Date.now(),
      date: new Date().toISOString(),
      text,
      prompt: debrief.prompts[0] || 'Debrief de sesión cerebral',
      difficulty: 'medio',
      source: 'brain_session',
    })
    setItem('reflections', entries)
    updateStats({ reflections: getStats().reflections + 1 })
  }
  finishGuidedSession(avgPct)
}

window.finishGuidedSession = function(avgPct) {
  const bonus = Math.floor(avgPct * 1.5)
  awardXp('mental', 40 + bonus, 'Sesión cerebral completada')
  processPlanAwards(checkPlanTask('brain'))
  recordActivity('brain')
  updateStats({ brainSessions: getStats().brainSessions + 1 })
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
    showToast('Solo protocolos del laboratorio', 0, 'mental')
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
  render()
}

function finishBrain(score = 0) {
  const diff = brainState.difficulty
  const game = brainState.exercise
  clearBrainTimers()
  recordActivity('brain')
  updateStats({ brainSessions: getStats().brainSessions + 1 })
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
  brainState.brainView = 'academy'
  render()
}

window.closeLesson = function() {
  brainState.activeLesson = null
  render()
}

window.completeLesson = function(id) {
  const wasDone = getCompletedLessons().includes(id)
  markLessonComplete(id)
  if (!wasDone) {
    awardXp('mental', 30, 'Lección de academia')
    recordActivity('brain')
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
  const reflect = skipReflect ? '' : document.getElementById('lesson-flow-reflect')?.value?.trim()
  if (reflect && reflect.length >= 15) {
    const lesson = LESSONS.find(l => l.id === flow.id)
    const entries = getItem('reflections', [])
    entries.unshift({
      id: Date.now(),
      date: new Date().toISOString(),
      text: reflect,
      prompt: lesson?.reflect || 'Reflexión de academia',
      difficulty: 'medio',
      source: 'academy',
      quizScore: flow.quizScore,
    })
    setItem('reflections', entries)
    updateStats({ reflections: getStats().reflections + 1 })
    processPlanAwards(checkPlanTask('reflection'))
  }
  brainState.lessonFlow = null
  brainState.activeLesson = null
  render()
}

window.goToLesson = function(id) {
  location.hash = '/gimnasia'
  brainState.brainView = 'academy'
  brainState.activeLesson = id
  brainState.lessonFlow = null
  render()
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

// --- Meditation ---
function clearMedTimers() { medTimers.forEach(t => clearInterval(t)); medTimers = [] }

function stopMeditationSession() {
  clearMedTimers()
  stopAmbientSound()
  medState.ambientPreview = false
}

function medAmbientVol(s) {
  const v = Number(s?.medAmbientVolume ?? 0.45)
  if (v <= 0) return 0
  return Math.max(0.2, Math.min(1, v))
}

function medAmbientPanelHTML(compact = false) {
  const s = getSettings()
  const vol = Math.round((s.medAmbientVolume ?? 0.45) * 100)
  const current = s.medAmbient || 'rain'
  const isSilent = current === 'off'
  const playing = isAmbientPlaying()
  return `<div class="med-ambient-panel ${compact ? 'med-ambient-panel--compact' : ''}">
    <div class="med-ambient-head">
      <span class="med-ambient-title">${compact ? '🎧 Ambiente' : 'Sonido ambiente'}</span>
      ${playing ? '<span class="med-ambient-live">● Sonando</span>' : isSilent ? '<span class="med-ambient-muted">Silencio</span>' : ''}
    </div>
    <div class="med-ambient-types">
      ${AMBIENT_PRESETS.map(p => `
        <button type="button" onclick="setMedAmbient('${p.id}')" class="med-ambient-btn ${current === p.id ? 'active' : ''}" title="${p.label}" aria-pressed="${current === p.id}">
          <span>${p.icon}</span><span class="med-ambient-btn-label">${p.label}</span>
        </button>`).join('')}
    </div>
    <label class="med-ambient-slider ${isSilent ? 'med-ambient-slider--off' : ''}">
      <span class="text-xs text-muted">Volumen</span>
      <input type="range" min="0" max="100" value="${isSilent ? 0 : vol}" ${isSilent ? 'disabled' : ''}
        oninput="setMedAmbientVol(Number(this.value)/100)" class="med-ambient-range" aria-label="Volumen ambiente">
      <span id="med-ambient-vol-pct" class="text-xs text-muted">${isSilent ? '—' : `${vol}%`}</span>
    </label>
    ${isSilent ? '<p class="med-ambient-hint">Silencio activo. Elige un sonido arriba para escuchar.</p>' : ''}
    ${compact ? '' : `<button type="button" onclick="toggleAmbientPreview()" class="btn-secondary w-full text-sm mt-2">
      ${playing ? '⏹ Detener sonido' : '▶ Probar sonido'}
    </button>`}
  </div>`
}

const MED_DURATIONS = { facil: 3, medio: 5, dificil: 8, experto: 12 }

function getMeditationMeta(id) {
  return MEDITATIONS.find(m => m.id === id)
}

function getMeditationSteps(id) {
  const meta = getMeditationMeta(id)
  if (!meta || meta.type !== 'steps' || !meta.stepsKey) return []
  return MEDITATION_STEPS[meta.stepsKey] || []
}

async function startMeditation(id) {
  stopMeditationSession()
  await resumeAudioContext()
  const diff = medState.difficulty || 'medio'
  const duration = MED_DURATIONS[diff]
  const meta = getMeditationMeta(id)
  medState = {
    session: id, difficulty: diff, completed: false, completedMin: duration,
    phase: 'inhale', elapsed: 0, step: 0, stepElapsed: 0,
    steps: getMeditationSteps(id),
    sessionName: meta?.name || 'Meditación',
  }
  const total = duration * 60
  const settings = getSettings()
  if (settings.sound) await playSingingBowl('start')
  if (settings.medAmbient && settings.medAmbient !== 'off') {
    await startAmbientSound(settings.medAmbient, medAmbientVol(settings))
  } else {
    stopAmbientSound()
  }

  if (id === 'breathing') {
    medTimers.push(setInterval(() => {
      medState.phase = medState.phase === 'inhale' ? 'hold' : medState.phase === 'hold' ? 'exhale' : 'inhale'
      playTone(medState.phase === 'inhale' ? 330 : 220, 0.15)
      if (!patchLiveUI('/meditacion')) render()
    }, diff === 'experto' ? 3000 : 4000))
  }

  medTimers.push(setInterval(() => {
    medState.elapsed++
    if (medState.steps?.length) {
      medState.stepElapsed++
      const step = medState.steps[medState.step]
      if (step && medState.stepElapsed >= step.duration && medState.step < medState.steps.length - 1) {
        medState.step++; medState.stepElapsed = 0
      }
    }
    if (medState.elapsed >= total) {
      clearMedTimers()
      stopAmbientSound()
      if (getSettings().sound) playSingingBowl('end')
      recordActivity('meditation')
      const xp = DIFFICULTIES[diff].xp
      awardXp('mindfulness', xp, 'Meditación completada')
      updateStats({ meditationMinutes: getStats().meditationMinutes + duration })
      processPlanAwards(checkPlanTask('meditation'))
      medState.completed = true
      render()
    } else if (!patchLiveUI('/meditacion')) {
      render()
    }
  }, 1000))
  render()
}

function renderMeditation() {
  if (medState.completed) return `<div class="animate-fade-in text-center page-shell page-wide"><div class="card">
    <p class="text-4xl mb-4">✨</p><h2 class="font-display text-2xl font-bold text-main mb-2">Sesión completada</h2>
    <p class="text-muted mb-2">${medState.completedMin} min · ${DIFFICULTIES[medState.difficulty].label}</p>
    <p class="font-bold text-main mb-6">+${DIFFICULTIES[medState.difficulty].xp} XP</p>
    <button onclick="stopMeditationSession();medState.session=null;medState.completed=false;render()" class="btn-primary">Continuar</button></div></div>`

  if (medState.session) {
    const duration = MED_DURATIONS[medState.difficulty]
    const total = duration * 60
    const remaining = total - medState.elapsed
    const mins = Math.floor(remaining / 60)
    const secs = (remaining % 60).toString().padStart(2, '0')
    const phase = { inhale: 'Inhala', hold: 'Mantén', exhale: 'Exhala' }
    let content
    if (medState.session === 'breathing') {
      const scale = medState.phase === 'inhale' ? 1.2 : medState.phase === 'exhale' ? 0.8 : 1.1
      content = `<p id="med-timer" class="text-sm text-muted mb-8">${mins}:${secs}</p>
        <div class="relative w-48 h-48 mx-auto mb-8">
          <div id="med-breathe-circle" class="absolute inset-0 rounded-full breathe-circle meditation-ring" style="transform:scale(${scale});transition:transform 4s"></div>
          <div class="absolute inset-0 flex items-center justify-center"><span id="med-phase-text" class="font-display text-2xl meditation-text">${phase[medState.phase]}</span></div>
        </div>`
    } else {
      const steps = medState.steps || []
      const step = steps[medState.step]
      content = `<p id="med-timer" class="text-sm text-muted mb-4">${mins}:${secs} · Paso ${medState.step + 1}/${steps.length}</p>
        <div class="progress-track w-full mb-8" style="height:0.5rem"><div id="med-progress-fill" class="progress-fill h-full" style="width:${(medState.elapsed/total)*100}%"></div></div>
        <p id="med-step-text" class="font-display text-lg text-main">${step?.text || ''}</p>`
    }
    return `<div class="page-shell page-wide page-meditation focus-session">
      <button onclick="stopMeditationSession();medState.session=null;render()" class="btn-secondary focus-exit">← Salir</button>
      <div class="med-active-grid">
        <div class="routine-active-side med-session-side">
          <p class="text-sm text-muted mb-4">${esc(medState.sessionName || '')}</p>
          ${medAmbientPanelHTML(true)}
        </div>
        <div class="card exercise-stage text-center">${content}</div>
      </div>
    </div>`
  }

  return `<div class="animate-fade-in page-shell page-wide page-meditation">
    <div class="ds-page ds-page--full">
    ${pageHero('Calma', 'Meditación guiada · respiración y presencia', `${MED_DURATIONS[medState.difficulty]} min`, 'duración')}
    ${sunsetBannerHTML(dailyApis?.sun)}
    <div class="page-dashboard">
      <div class="span-full">
        ${difficultyPicker(medState.difficulty, 'setMedDiff')}
      </div>
      <div class="span-full">${medAmbientPanelHTML()}</div>
      <div class="med-sessions-grid span-full">
      ${MEDITATIONS.map(s =>
        `<button onclick="startMeditation('${s.id}')" class="card text-left w-full cursor-pointer">
          <div class="flex items-center gap-4">
            <span class="text-3xl">${s.icon}</span>
            <div class="flex-1"><h3 class="font-semibold text-main">${s.name}</h3>
            <p class="text-sm text-muted">${s.desc}</p>
            ${s.neuro ? `<p class="text-xs mt-1" style="color:var(--primary)">🧠 ${s.neuro}</p>` : ''}
            <p class="text-xs text-muted mt-1">${MED_DURATIONS[medState.difficulty]} min · +${DIFFICULTIES[medState.difficulty].xp} XP</p></div>
          </div></button>`
      ).join('')}
      </div>
    </div>
    </div>
  </div>`
}

window.setMedDiff = (d) => { medState.difficulty = guardDifficulty(d); render() }

window.setMedAmbient = async function(type) {
  const s = getSettings()
  s.medAmbient = type
  saveSettings(s)
  await resumeAudioContext()
  if (type === 'off') {
    stopAmbientSound()
    medState.ambientPreview = false
  } else {
    const vol = medAmbientVol(s) || 0.45
    s.medAmbientVolume = vol
    saveSettings(s)
    const ok = await startAmbientSound(type, vol)
    medState.ambientPreview = ok
    if (!ok) showToast('No se pudo reproducir el sonido. Toca de nuevo.', 0, 'mindfulness')
  }
  render()
}

window.setMedAmbientVol = async function(v) {
  const vol = Math.max(0, Math.min(1, Number(v) || 0))
  const s = getSettings()
  s.medAmbientVolume = vol
  await resumeAudioContext()

  if (vol <= 0) {
    s.medAmbient = 'off'
    saveSettings(s)
    stopAmbientSound()
    medState.ambientPreview = false
    render()
    return
  }

  if (!s.medAmbient || s.medAmbient === 'off') {
    s.medAmbient = 'rain'
  }
  saveSettings(s)

  if (isAmbientPlaying()) {
    setAmbientVolume(vol)
  } else {
    await startAmbientSound(s.medAmbient, vol)
    medState.ambientPreview = true
  }

  const label = document.getElementById('med-ambient-vol-pct')
  if (label) label.textContent = `${Math.round(vol * 100)}%`
  const live = document.querySelector('.med-ambient-live')
  if (live) live.style.display = isAmbientPlaying() ? '' : 'none'
}

window.toggleAmbientPreview = async function() {
  await resumeAudioContext()
  if (isAmbientPlaying()) {
    stopAmbientSound()
    medState.ambientPreview = false
  } else {
    const s = getSettings()
    if (!s.medAmbient || s.medAmbient === 'off') {
      s.medAmbient = 'rain'
      s.medAmbientVolume = medAmbientVol(s) || 0.45
      saveSettings(s)
    }
    if (getSettings().sound) await playSingingBowl('start')
    const ok = await startAmbientSound(s.medAmbient, medAmbientVol(s))
    medState.ambientPreview = ok
    if (!ok) showToast('No se pudo reproducir el sonido. Toca de nuevo.', 0, 'mindfulness')
  }
  render()
}

// --- Mejora / Habits ---
function renderMejora() {
  const today = getToday()
  const habits = getHabits()
  const doneCount = getCompletedHabitsCount(today)

  let tabContent
  if (mejoraTab === 'habits') {
    tabContent = `<div class="ds-toolbar">
      <h3 class="ds-toolbar-title">Hábitos de hoy</h3>
      <button onclick="editingHabits=true;render()" class="btn-secondary text-sm">✏️ Editar</button>
    </div>
    ${editingHabits ? renderHabitEditor() : !habits.length ? emptyState({
      iconKey: 'habit',
      title: 'Sin hábitos activos',
      desc: 'Elige plantillas sugeridas o crea los tuyos para empezar a sumar XP.',
      ctaLabel: 'Agregar hábitos',
      ctaOnclick: 'editingHabits=true;render()',
    }) : `<div class="habits-grid">
      ${habits.map(h => {
        const hp = getHabitProgress(h.id)
        const hLevel = getLevel(hp.xp)
        const cat = HABIT_CATEGORIES[h.category] || HABIT_CATEGORIES.salud
        const diffStars = '★'.repeat(h.difficulty) + '☆'.repeat(5 - h.difficulty)
        const isDone = isHabitComplete(h, today)
        const count = getHabitCount(h.id, today)
        const isCounter = h.type === 'counter'
        const progressPct = isCounter ? Math.min(100, Math.round((count / h.target) * 100)) : (isDone ? 100 : 0)
        const control = isCounter
          ? `<div class="habit-counter ${isDone ? 'done' : ''}" onclick="event.stopPropagation()">
              <button onclick="adjustHabit('${h.id}',-1)">−</button>
              <span class="count">${count}/${h.target} ${h.unit}</span>
              <button onclick="adjustHabit('${h.id}',1)">+</button>
            </div>`
          : `<button onclick="toggleHabit('${h.id}')" class="habit-check ${isDone ? 'done' : ''}">${isDone ? '✓' : ''}</button>`
        return `<div class="habit-card ${isDone ? 'is-done' : ''}">
          <div class="habit-card-icon" aria-hidden="true">${h.icon}</div>
          <div class="habit-card-body">
            <div class="habit-card-title-row">
              <span class="habit-card-title ${isDone ? 'is-done' : ''}">${esc(h.name)}</span>
              <span class="habit-card-cat" style="--cat-color:${cat.color}">${cat.icon} ${cat.name}</span>
            </div>
            <div class="habit-card-meta">
              <span>Nv. ${hLevel}</span>
              <span class="habit-card-stars">${diffStars}</span>
              ${hp.streak > 0 ? `<span>🔥 ${hp.streak}</span>` : ''}
              <span>+${h.xp} XP</span>
            </div>
            ${isCounter ? `<div class="habit-card-progress">
              <div class="habit-card-progress-fill" style="width:${progressPct}%"></div>
            </div>` : ''}
          </div>
          <div class="habit-card-action">${control}</div>
        </div>`
      }).join('')}
    </div>
    <p class="text-sm text-muted mt-4 text-center">${doneCount}/${habits.length} completados hoy</p>`}`
  } else if (mejoraTab === 'diario') {
    const diff = getSettings().defaultDifficulty
    const prompt = getReflectionPrompt(diff)
    const entries = getItem('reflections', [])
    const weekly = getItem('weeklyReview', null)
    const monthly = getItem('monthlyReview', null)

    const sectionNav = [
      { id: 'daily', l: 'Hoy', i: '✨' },
      { id: 'weekly', l: 'Semanal', i: '📅' },
      ...(isUnlocked('review_monthly') ? [{ id: 'monthly', l: 'Mensual', i: '🗓️' }] : []),
      { id: 'history', l: 'Historial', i: '📖' },
    ]

    let sectionContent = ''
    if (diarioSection === 'daily') {
      sectionContent = `${moodPickerHTML()}
        ${adviceCardHTML(dailyApis?.advice)}
        ${readingCardHTML(dailyApis?.reading)}
        <h4 class="font-semibold text-main mb-2">Reflexión del día</h4>
        ${segmentBar(Object.entries(DIFFICULTIES).map(([k, d]) => ({ id: k, label: d.label, icon: d.icon, locked: d.locked, lockTitle: d.lockTitle })), diff, 'setReflectDiff')}
        <p class="text-muted text-sm mb-3 italic">"${prompt}"</p>
        <textarea id="reflection-text" class="input-field min-h-28 resize-none mb-3" placeholder="Escribe libremente..."></textarea>
        <button onclick="saveReflection()" class="btn-primary w-full">Guardar entrada (+${DIFFICULTIES[diff].xp} XP)</button>`
    } else if (diarioSection === 'weekly') {
      sectionContent = `<h4 class="font-semibold text-main mb-4">Revisión semanal</h4>
        ${WEEKLY_REVIEW_PROMPTS.map((q, i) => `<div class="mb-4">
          <p class="text-sm text-main mb-2">${i + 1}. ${q}</p>
          <textarea id="review-${i}" class="input-field min-h-16 resize-none" placeholder="Tu respuesta...">${weekly?.answers?.[i] || ''}</textarea>
        </div>`).join('')}
        <button onclick="saveWeeklyReview()" class="btn-primary w-full">Guardar revisión (+75 XP)</button>`
    } else if (diarioSection === 'monthly') {
      sectionContent = isUnlocked('review_monthly')
        ? `<h4 class="font-semibold text-main mb-4">Revisión mensual</h4>
          <p class="text-sm text-muted mb-4">Perspectiva de largo plazo para tus metas.</p>
          ${MONTHLY_REVIEW_PROMPTS.map((q, i) => `<div class="mb-4">
            <p class="text-sm text-main mb-2">${i + 1}. ${q}</p>
            <textarea id="monthly-${i}" class="input-field min-h-16 resize-none" placeholder="Tu respuesta...">${monthly?.answers?.[i] || ''}</textarea>
          </div>`).join('')}
          <button onclick="saveMonthlyReview()" class="btn-primary w-full">Guardar revisión (+120 XP)</button>`
        : `<p class="text-muted text-center py-8">🔒 Desbloquea la revisión mensual en nivel 8</p>`
    } else {
      sectionContent = entries.length
        ? `<div class="space-y-3 max-h-96 overflow-y-auto">
          ${entries.slice(0, 20).map(e => {
            const mood = e.mood ? MOODS.find(m => m.id === e.mood) : null
            return `<div class="reflection-entry rounded-xl p-3">
              <p class="text-xs text-muted">${new Date(e.date).toLocaleDateString('es',{weekday:'short',day:'numeric',month:'short'})} ${mood ? mood.emoji : ''} · ${e.difficulty || 'medio'}</p>
              ${e.prompt ? `<p class="text-xs italic text-muted">${esc(e.prompt)}</p>` : ''}
              <p class="text-sm text-main mt-1">${esc(e.text)}</p>
            </div>`
          }).join('')}
        </div>`
        : emptyState({
          iconKey: 'spark',
          title: 'Sin entradas aún',
          desc: 'Escribe tu primera reflexión en la pestaña Hoy.',
          ctaLabel: 'Ir a Hoy',
          ctaOnclick: "diarioSection='daily';render()",
        })
    }

    tabContent = `<div class="ds-diario">
      <div class="ds-diario-nav">${subTabBar(
        sectionNav.map(s => ({ id: s.id, label: s.l, icon: s.i })),
        diarioSection,
        'diarioSection',
      )}</div>
      <div class="ds-diario-body">${sectionContent}</div>
    </div>`
  }

  const tabs = [
    { id: 'habits', l: 'Hábitos', i: '✅' },
    { id: 'diario', l: 'Diario', i: '📝' },
  ]

  const habitsChart = mejoraTab === 'habits' && !editingHabits && getHabits().length
    ? `<div class="mejora-week-chart">${habitChartHTML()}</div>`
    : ''

  const habitsBody = mejoraTab === 'habits' && habitsChart
    ? `<div class="mejora-habits-layout">${habitsChart}<div class="mejora-habits-main">${tabContent}</div></div>`
    : tabContent

  return `<div class="animate-fade-in page-shell page-wide page-mejora">
    <div class="ds-page ds-page--full">
      ${tabBar(tabs.map(t => ({ id: t.id, label: t.l, icon: t.i })), mejoraTab, 'mejoraTab', 'editingHabits=false;')}
      <div class="mejora-tab-panel ds-panel ds-panel--flat">
        ${mejoraTab === 'habits' ? pageLead('Marca cada hábito al completarlo · XP y racha por hábito') : pageLead('Reflexión, ánimo y revisiones semanales')}
        ${habitsBody}
      </div>
    </div>
  </div>`
}

function renderHabitEditor() {
  const habits = getHabits()
  const existingIds = new Set(habits.map(h => h.id))
  const suggestions = HABIT_TEMPLATES.filter(t => !existingIds.has(t.id) && !existingIds.has(t.id.replace('tpl_', '')))
  return `<div class="space-y-3">
    ${suggestions.length ? `<div class="mb-4">
      <p class="text-sm font-medium text-main mb-2">Plantillas sugeridas</p>
      <div class="flex flex-wrap gap-2">
        ${suggestions.slice(0, 12).map(t => {
          const cat = HABIT_CATEGORIES[t.category] || HABIT_CATEGORIES.salud
          return `<button type="button" onclick="addHabitTemplate('${t.id}')" class="px-3 py-2 rounded-xl text-xs text-left" style="background:${cat.color}18;border:1px solid ${cat.color}44">
            ${t.icon} ${esc(t.name)}
          </button>`
        }).join('')}
      </div>
    </div>` : ''}
    ${habits.map((h, i) => `<div class="p-3 rounded-xl" style="background:var(--secondary-bg)">
      <div class="flex gap-2 mb-2">
        <input value="${esc(h.icon)}" onchange="updateHabitField(${i},'icon',this.value)" class="input-field w-14 text-center text-xl">
        <input value="${esc(h.name)}" onchange="updateHabitField(${i},'name',this.value)" class="input-field flex-1">
        <button onclick="removeHabit(${i})" class="btn-ghost text-red-400">✕</button>
      </div>
      <div class="flex gap-2">
        <select onchange="updateHabitField(${i},'category',this.value)" class="input-field flex-1 text-sm">
          ${Object.entries(HABIT_CATEGORIES).map(([k,c]) => `<option value="${k}" ${h.category===k?'selected':''}>${c.icon} ${c.name}</option>`).join('')}
        </select>
        <select onchange="updateHabitField(${i},'difficulty',parseInt(this.value))" class="input-field w-24 text-sm">
          ${[1,2,3,4,5].map(d => `<option value="${d}" ${h.difficulty===d?'selected':''}>★${d}</option>`).join('')}
        </select>
        <input type="number" value="${h.xp}" onchange="updateHabitField(${i},'xp',parseInt(this.value))" class="input-field w-20 text-sm" title="XP">
      </div>
      <div class="flex gap-2 mt-2">
        <select onchange="updateHabitField(${i},'type',this.value)" class="input-field flex-1 text-sm">
          <option value="check" ${h.type==='check'?'selected':''}>✓ Checkbox</option>
          <option value="counter" ${h.type==='counter'?'selected':''}>🔢 Contador</option>
        </select>
        <input type="number" min="1" value="${h.target || 1}" onchange="updateHabitField(${i},'target',parseInt(this.value))" class="input-field w-20 text-sm" title="Meta">
        <input value="${esc(h.unit || 'vez')}" onchange="updateHabitField(${i},'unit',this.value)" class="input-field flex-1 text-sm" placeholder="Unidad">
      </div>
    </div>`).join('')}
    <div class="flex gap-2 mt-4">
      <button onclick="addHabit()" class="btn-secondary flex-1">+ Agregar</button>
      <button onclick="editingHabits=false;render()" class="btn-primary flex-1">Listo</button>
    </div>
  </div>`
}

window.updateHabitField = (i, field, val) => { const h = getHabits(); h[i][field] = val; setItem('habits', h) }
window.removeHabit = (i) => { const h = getHabits(); h.splice(i, 1); setItem('habits', h); render() }
window.addHabit = () => {
  const h = getHabits()
  h.push({ id: 'custom_' + Date.now(), name: 'Nuevo hábito', icon: '⭐', category: 'productividad', difficulty: 2, xp: 25, type: 'check', target: 1, unit: 'vez' })
  setItem('habits', h); render()
}
window.addHabitTemplate = (tplId) => {
  const tpl = HABIT_TEMPLATES.find(t => t.id === tplId)
  if (!tpl) return
  const h = getHabits()
  if (h.some(x => x.id === tpl.id || x.name === tpl.name)) return
  h.push({ ...tpl, id: tpl.id.replace('tpl_', '') || tpl.id })
  setItem('habits', h)
  render()
}
window.adjustHabit = function(id, delta) {
  const habit = getHabits().find(h => h.id === id)
  if (!habit) return
  if (delta > 0) {
    const result = incrementHabit(habit)
    if (result?.completed) {
      awardXp('discipline', result.xp, result.name)
      processPlanAwards(checkPlanTask('habit'))
    }
  } else decrementHabit(habit)
  render()
}
window.toggleHabit = function(id) {
  const habit = getHabits().find(h => h.id === id)
  if (!habit || habit.type === 'counter') return
  if (isHabitComplete(habit)) uncompleteHabit(id)
  else {
    const result = completeHabit(habit)
    if (result?.completed) {
      haptic(20)
      playHabitDone()
      awardXp('discipline', result.xp, result.name)
      processPlanAwards(checkPlanTask('habit'))
    }
  }
  render()
}
window.setReflectDiff = (d) => { const s = getSettings(); s.defaultDifficulty = guardDifficulty(d); saveSettings(s); render() }
window.pickMood = function(id) {
  const wasSet = getMood()
  const mood = setMood(id)
  if (!wasSet) awardXp('wisdom', 10, `Ánimo: ${mood.label}`)
  render()
}

window.saveReflection = function() {
  const text = document.getElementById('reflection-text')?.value?.trim()
  if (!text || text.length < 15) { alert('Escribe al menos 15 caracteres.'); return }
  const diff = getSettings().defaultDifficulty
  const prompt = getReflectionPrompt(diff)
  const entries = getItem('reflections', [])
  const mood = getMood()
  entries.unshift({ id: Date.now(), date: new Date().toISOString(), prompt, text, difficulty: diff, mood: mood?.id || null })
  setItem('reflections', entries)
  recordActivity('reflection')
  awardXp('wisdom', DIFFICULTIES[diff].xp, 'Reflexión guardada')
  updateStats({ reflections: getStats().reflections + 1 })
  processPlanAwards(checkPlanTask('reflection'))
  processPlanAwards(checkPlanTask('evening'))
  render()
}
window.saveWeeklyReview = function() {
  const answers = WEEKLY_REVIEW_PROMPTS.map((_, i) => document.getElementById(`review-${i}`)?.value?.trim() || '')
  if (answers.some(a => a.length < 10)) { alert('Responde todas las preguntas (mín. 10 caracteres).'); return }
  setItem('weeklyReview', { date: getToday(), answers })
  awardXp('wisdom', 75, 'Revisión semanal')
  render()
}
window.saveMonthlyReview = function() {
  const answers = MONTHLY_REVIEW_PROMPTS.map((_, i) => document.getElementById(`monthly-${i}`)?.value?.trim() || '')
  if (answers.some(a => a.length < 15)) { alert('Responde todas las preguntas (mín. 15 caracteres).'); return }
  setItem('monthlyReview', { date: getToday(), answers })
  awardXp('wisdom', 120, 'Revisión mensual')
  render()
}

// --- Enfoque ---
function renderEnfoque() {
  const progress = pomodoro.mode === 'work'
    ? ((25*60 - (pomodoro.minutes*60+pomodoro.seconds))/(25*60))*100
    : ((5*60 - (pomodoro.minutes*60+pomodoro.seconds))/(5*60))*100
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
            <circle id="pomo-progress" cx="50" cy="50" r="45" fill="none" stroke="${pomodoro.mode==='work'?'#ff8c69':'var(--primary)'}" stroke-width="6" stroke-dasharray="${progress*2.83} 283" stroke-linecap="round"/>
          </svg>
          <div class="absolute inset-0 flex items-center justify-center"><span id="pomo-timer" class="font-display text-3xl font-bold text-main">${String(pomodoro.minutes).padStart(2,'0')}:${String(pomodoro.seconds).padStart(2,'0')}</span></div>
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

window.togglePomodoro = function() {
  pomodoro.active = !pomodoro.active
  if (pomodoro.active) {
    if (pomodoroTimer) clearInterval(pomodoroTimer)
    pomodoroTimer = setInterval(() => {
      if (pomodoro.seconds === 0 && pomodoro.minutes === 0) {
        pomodoro.active = false; clearInterval(pomodoroTimer); playTone(440, 0.3)
        if (pomodoro.mode === 'work') {
          pomodoro.mode = 'break'; pomodoro.minutes = 5
          const s = getItem('pomodoroSessions', 0) + 1
          setItem('pomodoroSessions', s)
          awardXp('discipline', 20, 'Sesión de enfoque')
          processPlanAwards(checkPlanTask('focus'))
        } else { pomodoro.mode = 'work'; pomodoro.minutes = 25 }
        pomodoro.seconds = 0
      } else if (pomodoro.seconds === 0) { pomodoro.minutes--; pomodoro.seconds = 59 }
      else pomodoro.seconds--
      render()
    }, 1000)
  } else if (pomodoroTimer) clearInterval(pomodoroTimer)
  render()
}
window.resetPomodoro = function() {
  pomodoro.active = false; if (pomodoroTimer) clearInterval(pomodoroTimer)
  pomodoro.minutes = pomodoro.mode === 'work' ? 25 : 5; pomodoro.seconds = 0; render()
}

// --- Settings ---
function formatCloudTime(iso) {
  if (!iso) return 'Nunca'
  try {
    return new Date(iso).toLocaleString('es', { dateStyle: 'short', timeStyle: 'short' })
  } catch {
    return '—'
  }
}

function renderCloudAccountPanel() {
  const cloud = getCloudStatus()
  if (!cloud.configured) {
    return `${pageLead('Sincroniza tu progreso entre dispositivos con Supabase.')}
      ${settingGroup('Configuración pendiente', `
        <p class="ds-setting-hint">Crea un proyecto en <a href="https://supabase.com" target="_blank" rel="noopener" class="text-link">supabase.com</a>, ejecuta <code>supabase/schema.sql</code> y copia <code>js/supabase-config.example.js</code> → <code>js/supabase-config.local.js</code> con tu URL y anon key.</p>
      `)}`
  }
  if (cloud.signedIn) {
    return `${pageLead('Tu progreso se guarda en la nube automáticamente.')}
      ${settingGroup('Cuenta', `
        <p class="ds-setting-hint">Conectado como <strong>${esc(cloud.email || '')}</strong></p>
        <p class="ds-setting-hint">Última sync: ${formatCloudTime(cloud.lastSyncedAt)}${cloud.syncing ? ' · sincronizando…' : ''}</p>
        <div class="flex flex-col gap-2 mt-3">
          <button type="button" onclick="cloudSyncNow()" class="btn-primary w-full" ${cloud.syncing ? 'disabled' : ''}>☁️ Sincronizar ahora</button>
          <button type="button" onclick="cloudPullNow()" class="btn-secondary w-full" ${cloud.syncing ? 'disabled' : ''}>⬇️ Traer de la nube</button>
          <button type="button" onclick="cloudSignOut()" class="btn-ghost w-full">Cerrar sesión</button>
        </div>
        <p id="cloud-status-msg" class="text-sm text-muted mt-3 text-center"></p>
      `)}`
  }
  return `${pageLead('Crea una cuenta para no perder tu progreso al cambiar de dispositivo.')}
    ${settingGroup('Iniciar sesión', `
      <div class="flex flex-col gap-2">
        <input id="cloud-email" type="email" class="input-field" placeholder="Correo" autocomplete="email">
        <input id="cloud-password" type="password" class="input-field" placeholder="Contraseña (mín. 6)" autocomplete="current-password">
        <button type="button" onclick="cloudSignIn()" class="btn-primary w-full">Entrar</button>
        <button type="button" onclick="cloudSignUp()" class="btn-secondary w-full">Crear cuenta</button>
      </div>
      <p id="cloud-status-msg" class="text-sm text-muted mt-3 text-center"></p>
      <p class="ds-setting-hint mt-2">Si activas confirmación por correo en Supabase, revisa tu bandeja antes de entrar.</p>
    `)}`
}

function renderSettings() {
  const s = getSettings()
  const notifBlock = !canUseNotifications()
    ? '<p class="ds-setting-hint">Tu navegador no soporta notificaciones.</p>'
    : getNotificationPermission() === 'denied'
      ? '<p class="ds-setting-hint">Permiso bloqueado. Habilítalo en ajustes del navegador.</p>'
      : `<p class="ds-setting-hint">Te avisamos si el plan del día no está completo.</p>
        <select onchange="setReminderHour(parseInt(this.value))" class="input-field mt-2" ${!s.notificationsEnabled ? 'disabled' : ''}>
          <option value="">Sin hora fija</option>
          ${[7, 8, 9, 12, 18, 19, 20, 21, 22].map(h => `<option value="${h}" ${s.reminderHour === h ? 'selected' : ''}>${h}:00</option>`).join('')}
        </select>`

  const content = settingsTab === 'general' ? `
    ${settingGroup('Interfaz', `
      ${settingRow('Sidebar compacto', `<input type="checkbox" ${s.compactSidebar ? 'checked' : ''} onchange="toggleCompactSidebar(this.checked)">`)}
      ${settingRow('Sonidos', `<input type="checkbox" ${s.sound ? 'checked' : ''} onchange="toggleSound(this.checked)">`)}
      ${settingRow('Reducir animaciones', `<input type="checkbox" ${s.reducedMotion ? 'checked' : ''} onchange="toggleReducedMotion(this.checked)">`, 'Menos movimiento y efectos visuales.')}
    `)}
    ${settingGroup('Notificaciones', `
      <div class="ds-setting-row ds-setting-row--stack">
        <label class="flex justify-between items-center w-full">
          <span class="ds-setting-label">Recordatorios del plan</span>
          <input type="checkbox" ${s.notificationsEnabled ? 'checked' : ''} onchange="toggleNotifications(this.checked)">
        </label>
        ${notifBlock}
      </div>
      <div class="ds-setting-row ds-setting-row--stack">
        <label class="flex justify-between items-center w-full">
          <span class="ds-setting-label">Recordatorio de hábitos</span>
          <input type="checkbox" ${s.habitRemindersEnabled ? 'checked' : ''} onchange="toggleHabitReminders(this.checked)" ${!s.notificationsEnabled ? 'disabled' : ''}>
        </label>
        <p class="ds-setting-hint">Aviso si faltan hábitos por completar.</p>
        <select onchange="setHabitReminderHour(parseInt(this.value))" class="input-field" ${!s.notificationsEnabled || !s.habitRemindersEnabled ? 'disabled' : ''}>
          <option value="">Sin hora fija</option>
          ${[12, 17, 18, 19, 20, 21].map(h => `<option value="${h}" ${s.habitReminderHour === h ? 'selected' : ''}>${h}:00</option>`).join('')}
        </select>
      </div>
      <div class="ds-setting-row">
        <div>
          <span class="ds-setting-label">Aviso al atardecer</span>
          <p class="ds-setting-hint">~30 min antes del ocaso, invita a meditar.</p>
        </div>
        <input type="checkbox" ${s.sunsetRemindersEnabled !== false ? 'checked' : ''} onchange="toggleSunsetReminders(this.checked)" ${!s.notificationsEnabled ? 'disabled' : ''}>
      </div>
    `)}
    ${settingGroup('Preferencias', `
      <div class="ds-setting-row ds-setting-row--stack">
        <span class="ds-setting-label">Dificultad por defecto</span>
        <select onchange="setDefaultDiff(this.value)" class="input-field">
          ${Object.entries(DIFFICULTIES).map(([k, d]) => {
            const locked = k === 'experto' && !isUnlocked('diff_expert')
            return `<option value="${k}" ${s.defaultDifficulty === k ? 'selected' : ''} ${locked ? 'disabled' : ''}>${locked ? '🔒 ' : ''}${d.icon} ${d.label}</option>`
          }).join('')}
        </select>
      </div>
      <div class="ds-setting-row ds-setting-row--stack">
        <span class="ds-setting-label">País (festivos y clima)</span>
        <select onchange="setCountry(this.value)" class="input-field">
          ${[['MX', 'México'], ['ES', 'España'], ['AR', 'Argentina'], ['CO', 'Colombia'], ['CL', 'Chile'], ['PE', 'Perú'], ['US', 'Estados Unidos']]
            .map(([code, name]) => `<option value="${code}" ${(s.country || 'MX') === code ? 'selected' : ''}>${name}</option>`).join('')}
        </select>
        <p class="ds-setting-hint">El clima usa tu ubicación si la permites, o la capital del país.</p>
        <button type="button" onclick="requestLocationRefresh()" class="btn-secondary w-full text-sm mt-1">📍 Actualizar ubicación</button>
      </div>
    `)}
    ${settingGroup('Tema visual', `
      <p class="ds-setting-hint" style="margin:0 0 0.5rem">${getUnlocked().filter(u => u.type === 'theme').length + 1} temas disponibles</p>
      <div class="ds-theme-grid">
        ${Object.entries(THEMES).map(([id, t]) => {
          const unlocked = id === 'default' || isUnlocked(id)
          const active = (s.theme || 'default') === id
          const unlock = UNLOCKS.find(u => u.id === id)
          return `<button onclick="${unlocked ? `setTheme('${id}')` : ''}" class="ds-theme-btn ${active ? 'btn-primary is-active' : 'btn-secondary'} ${!unlocked ? 'opacity-40' : ''}">
            ${unlocked ? t.icon : '🔒'} ${t.name}${!unlocked && unlock ? ` (Nv.${unlock.level})` : ''}
          </button>`
        }).join('')}
      </div>
    `)}
  ` : settingsTab === 'account' ? renderCloudAccountPanel() : `
    ${pageLead('Respalda tu progreso, niveles y logros.')}
    ${settingRow('Respaldo automático semanal', `<input type="checkbox" ${s.autoBackupEnabled ? 'checked' : ''} onchange="toggleAutoBackup(this.checked)">`, 'Descarga un JSON cada 7 días si la app está abierta.')}
    <div class="flex flex-col gap-2 mt-4">
      <button onclick="exportData()" class="btn-primary w-full">📤 Exportar todo</button>
      <button onclick="exportMonthlyReportText()" class="btn-secondary w-full">📄 Informe mensual (.txt)</button>
      <button onclick="restartTour()" class="btn-ghost w-full">🎯 Repetir tour guiado</button>
      <label class="btn-secondary w-full block text-center cursor-pointer">📥 Importar<input type="file" accept=".json" onchange="importData(event)" class="hidden"></label>
    </div>
    <p id="import-status" class="text-sm text-muted mt-3 text-center"></p>`

  return `<div class="animate-fade-in page-shell page-wide page-settings">
    <div class="ds-page ds-page--full">
      ${tabBar([
        { id: 'general', label: 'General', icon: '⚙️' },
        { id: 'account', label: 'Cuenta', icon: '☁️' },
        { id: 'data', label: 'Datos', icon: '💾' },
      ], settingsTab, 'settingsTab')}
      <div class="ds-panel">${content}</div>
    </div>
  </div>`
}

window.toggleDark = (v) => { const s = getSettings(); s.darkMode = v; saveSettings(s); render() }
window.toggleCompactSidebar = (v) => {
  const s = getSettings(); s.compactSidebar = v; saveSettings(s); applyCompactSidebar(v); render()
}
window.toggleSound = (v) => { const s = getSettings(); s.sound = v; saveSettings(s) }
window.toggleReducedMotion = (v) => { const s = getSettings(); s.reducedMotion = v; saveSettings(s) }
window.toggleHabitReminders = (v) => {
  const s = getSettings(); s.habitRemindersEnabled = v
  if (v && !s.habitReminderHour) s.habitReminderHour = 18
  saveSettings(s); if (s.notificationsEnabled) startReminderChecker(getPlanProgress); render()
}
window.setHabitReminderHour = (h) => { const s = getSettings(); s.habitReminderHour = h || null; saveSettings(s) }
window.toggleSunsetReminders = (v) => {
  const s = getSettings()
  s.sunsetRemindersEnabled = v
  saveSettings(s)
  if (s.notificationsEnabled) startReminderChecker(getPlanProgress)
  render()
}
window.toggleAutoBackup = (v) => { const s = getSettings(); s.autoBackupEnabled = v; saveSettings(s) }

function setCloudMsg(msg, ok = true) {
  const el = document.getElementById('cloud-status-msg')
  if (el) {
    el.textContent = msg
    el.style.color = ok ? '' : 'var(--color-danger, #c44)'
  }
}

window.cloudSignIn = async function() {
  const email = document.getElementById('cloud-email')?.value?.trim()
  const password = document.getElementById('cloud-password')?.value
  if (!email || !password) { setCloudMsg('Correo y contraseña requeridos', false); return }
  try {
    await signIn(email, password)
    setCloudMsg('✓ Sesión iniciada')
    playSuccess()
    render()
  } catch (e) {
    setCloudMsg(e?.message || 'No se pudo iniciar sesión', false)
  }
}

window.cloudSignUp = async function() {
  const email = document.getElementById('cloud-email')?.value?.trim()
  const password = document.getElementById('cloud-password')?.value
  if (!email || !password || password.length < 6) {
    setCloudMsg('Correo y contraseña (mín. 6 caracteres)', false)
    return
  }
  try {
    const data = await signUp(email, password)
    if (data.session) {
      setCloudMsg('✓ Cuenta creada')
      playSuccess()
      render()
    } else {
      setCloudMsg('Revisa tu correo para confirmar la cuenta')
    }
  } catch (e) {
    setCloudMsg(e?.message || 'No se pudo crear la cuenta', false)
  }
}

window.cloudSignOut = async function() {
  await signOut()
  setCloudMsg('Sesión cerrada')
  render()
}

window.cloudSyncNow = async function() {
  try {
    await pushToCloud({ force: true })
    setCloudMsg('✓ Subido a la nube')
    playSuccess()
    render()
  } catch (e) {
    setCloudMsg(e?.message || 'Error al sincronizar', false)
  }
}

window.cloudPullNow = async function() {
  try {
    await pullFromCloud()
    setCloudMsg('✓ Datos descargados')
    playSuccess()
    render(true)
  } catch (e) {
    setCloudMsg(e?.message || 'Error al descargar', false)
  }
}
window.exportMonthlyReportText = exportMonthlyReportText
window.restartTour = function() {
  const s = getSettings(); s.tourComplete = false; saveSettings(s)
  setTimeout(() => startTour(), 300)
}
window.toggleNotifications = async function(v) {
  const s = getSettings()
  if (v) {
    const perm = await requestNotificationPermission()
    if (perm !== 'granted') { s.notificationsEnabled = false; saveSettings(s); alert('Necesitas permitir notificaciones para usar recordatorios.'); render(); return }
  }
  s.notificationsEnabled = v
  if (v && !s.reminderHour) s.reminderHour = 20
  saveSettings(s)
  if (v) startReminderChecker(getPlanProgress)
  render()
}
window.setReminderHour = (h) => {
  const s = getSettings()
  s.reminderHour = h || null
  saveSettings(s)
}
window.setDefaultDiff = (v) => { const s = getSettings(); s.defaultDifficulty = guardDifficulty(v); saveSettings(s) }
window.setTheme = (id) => {
  if (id !== 'default' && !isUnlocked(id)) return
  const s = getSettings()
  s.theme = id
  saveSettings(s)
  applyTheme(id)
  render()
}
window.requestLocationRefresh = async function() {
  const { requestUserLocation } = await import('./apis.js')
  const geo = await requestUserLocation()
  const s = getSettings()
  if (geo) {
    s.latitude = Math.round(geo.lat * 100) / 100
    s.longitude = Math.round(geo.lon * 100) / 100
    s.locationName = 'Tu ubicación'
    s.locationAsked = true
    saveSettings(s)
    dailyApis = null
    await loadDailyApis()
    render()
  } else {
    alert('No se pudo obtener tu ubicación. Revisa los permisos del navegador.')
  }
}

window.setCountry = (code) => {
  const s = getSettings()
  s.country = code
  s.latitude = null
  s.longitude = null
  s.locationName = ''
  saveSettings(s)
  dailyApis = null
  loadDailyApis()
}
window.exportData = function() {
  const data = {}
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key.startsWith(PREFIX)) data[key.replace(PREFIX, '')] = JSON.parse(localStorage.getItem(key))
  }
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)]))
  a.download = `mejora-backup-${getToday()}.json`; a.click()
}
window.importData = function(e) {
  const file = e.target.files[0]; if (!file) return
  const reader = new FileReader()
  reader.onload = (ev) => {
    try {
      Object.entries(JSON.parse(ev.target.result)).forEach(([k, v]) => setItem(k, v))
      const imported = getSettings()
      saveSettings(imported)
      applyTheme(imported.theme)
      document.getElementById('import-status').textContent = '✓ Importado'
      setTimeout(render, 800)
    } catch { document.getElementById('import-status').textContent = '✗ Error' }
  }
  reader.readAsText(file)
}

// --- Router ---
const routes = {
  '/': renderHomePage, '/plan': renderPlan, '/rutina': renderRoutine, '/gimnasia': renderBrainGym,
  '/meditacion': renderMeditation, '/mejora': renderMejora, '/enfoque': renderEnfoque,
  '/ajustes': renderSettings, '/perfil': renderProfile, '/desafios': renderPlan,
  '/metas': renderMetas, '/viaje': renderViaje, '/hoy': renderSoloHoy,
}

window.setOnboardGoal = function(i) { onboarding.goal = i; render() }

window.toggleOnboardHabit = function(id) {
  if (onboarding.selectedHabits.includes(id)) onboarding.selectedHabits = onboarding.selectedHabits.filter(h => h !== id)
  else if (onboarding.selectedHabits.length < 3) onboarding.selectedHabits.push(id)
  playClick()
  render()
}

window.onboardDemoBreath = function() {
  if (onboarding.demoBreaths >= 3) return
  onboarding.demoBreaths++
  haptic(10)
  playTone(330, 0.12)
  render()
}

window.onboardNext = function() {
  if (onboarding.step === 0) {
    const name = document.getElementById('onboard-name')?.value?.trim()
    const s = getSettings()
    s.userName = name || ''
    saveSettings(s)
  }
  if (onboarding.step === 2) {
    const all = getHabits()
    const selected = all.filter(h => onboarding.selectedHabits.includes(h.id))
    setItem('habits', selected.length ? selected : all.slice(0, 3))
  }
  onboarding.step++
  playClick()
  render()
}

window.finishOnboarding = async function() {
  if (onboarding.goal !== null) addGoal(GOAL_TEMPLATES[onboarding.goal])
  const s = getSettings()
  s.onboardingComplete = true
  const reminder = document.getElementById('onboard-reminder')?.value
  if (reminder) s.reminderHour = parseInt(reminder)
  if (s.reminderHour && !s.notificationsEnabled) {
    const perm = await requestNotificationPermission()
    if (perm === 'granted') s.notificationsEnabled = true
  }
  saveSettings(s)
  if (s.notificationsEnabled) startReminderChecker(getPlanProgress)
  onboarding.step = 0
  resetOnboardingCache()
  playSuccess()
  celebrate()
  showToast('¡Tu viaje comienza!', 0, 'discipline')
  location.hash = '/plan'
  render(true)
  setTimeout(() => { if (shouldShowTour()) startTour() }, 600)
}

function patchLiveUI(path) {
  if (path === '/meditacion' && medState.session && !medState.completed) {
    const duration = MED_DURATIONS[medState.difficulty]
    const total = duration * 60
    const remaining = total - medState.elapsed
    const mins = Math.floor(remaining / 60)
    const secs = (remaining % 60).toString().padStart(2, '0')
    const timerEl = document.getElementById('med-timer')
    if (!timerEl) return false
    if (medState.session === 'breathing') {
      const scale = medState.phase === 'inhale' ? 1.2 : medState.phase === 'exhale' ? 0.8 : 1.1
      const phase = { inhale: 'Inhala', hold: 'Mantén', exhale: 'Exhala' }
      const phaseEl = document.getElementById('med-phase-text')
      const circleEl = document.getElementById('med-breathe-circle')
      if (!phaseEl || !circleEl) return false
      timerEl.textContent = `${mins}:${secs}`
      phaseEl.textContent = phase[medState.phase]
      circleEl.style.transform = `scale(${scale})`
    } else {
      const steps = medState.steps || []
      const step = steps[medState.step]
      const stepEl = document.getElementById('med-step-text')
      const progressEl = document.getElementById('med-progress-fill')
      if (!stepEl || !progressEl) return false
      timerEl.textContent = `${mins}:${secs} · Paso ${medState.step + 1}/${steps.length}`
      progressEl.style.width = `${(medState.elapsed / total) * 100}%`
      stepEl.textContent = step?.text || ''
    }
    return true
  }
  if (path === '/enfoque' && pomodoro.active) {
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
  if (path === '/gimnasia' && brainState.exercise && patchBrainExerciseUI()) {
    return true
  }
  if (path === '/rutina' && routineState.active && routineState.step === 1) {
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
  return false
}

function renderCore() {
  const { parts, path } = parsePath()
  if (path !== '/meditacion') {
    if (medState.session) {
      stopMeditationSession()
      medState.session = null
      medState.completed = false
    } else if (medState.ambientPreview || isAmbientPlaying()) {
      stopAmbientSound()
      medState.ambientPreview = false
    }
  }
  if (path === '/mejora') {
    if (parts[1] === 'diario') {
      mejoraTab = 'diario'
      if (parts[2]) diarioSection = parts[2]
    }
    if (mejoraTab === 'journal') mejoraTab = 'diario'
  }
  const content = document.getElementById('app-content')
  const sameRoute = path === getLastRenderPath()
  const livePatch = sameRoute && patchLiveUI(path)

  if (livePatch) {
    content.classList.add('route-stable')
    content.classList.remove('route-enter')
    return
  }

  content.classList.remove('route-stable', 'route-enter')
  content.innerHTML = (routes[path] || routes['/'])()
  if (!sameRoute) {
    requestAnimationFrame(() => content.classList.add('route-enter'))
    setLastRenderPath(path)
  } else {
    content.classList.add('route-stable')
  }

  setActiveNav(path)
  const progress = getPlanProgress()
  const rank = getRank()
  const settings = getSettings()
  applyCompactSidebar(settings.compactSidebar)
  updateSidebarStats({
    streak: getStreak(),
    level: getTotalLevel(),
    rankTitle: rank.title,
    planPercent: progress.percent,
  })
  const w = formatWeather(dailyApis?.weather)
  updateTopBanner(path, {
    streak: getStreak(),
    planPercent: progress.percent,
    planDone: progress.done,
    planTotal: progress.total,
    planAllDone: progress.allDone,
    rankIcon: rank.icon,
    userName: settings.userName,
    shield: getStreakShieldStatus(),
    weather: w && dailyApis?.weather
      ? { temp: dailyApis.weather.temp, icon: w.icon, label: w.label }
      : null,
  })
  maybeAutoBackup()
  renderOnboardingOverlay()
  updateAppShell(path, {
    meditation: !!medState.session && path === '/meditacion',
    pomodoro: pomodoro.active && path === '/enfoque',
    routine: routineState.active && path === '/rutina',
    brainExercise: !!brainState.exercise && path === '/gimnasia',
  })
}

function showInstallBanner() {
  if (document.getElementById('install-banner') || !deferredInstallPrompt) return
  const el = document.createElement('div')
  el.id = 'install-banner'
  el.className = 'install-banner'
  el.innerHTML = `<span class="text-2xl">📲</span><div class="flex-1"><p class="text-sm font-medium text-main">Instalar Mejora</p><p class="text-xs text-muted">Acceso rápido y modo offline</p></div>
    <button onclick="installApp()" class="btn-primary text-sm py-2">Instalar</button>
    <button onclick="dismissInstall()" class="btn-ghost text-sm">✕</button>`
  document.body.appendChild(el)
}

window.installApp = async function() {
  if (!deferredInstallPrompt) return
  deferredInstallPrompt.prompt()
  await deferredInstallPrompt.userChoice
  deferredInstallPrompt = null
  document.getElementById('install-banner')?.remove()
}

window.dismissInstall = function() {
  setItem('installDismissed', true)
  document.getElementById('install-banner')?.remove()
}

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault()
  if (!getItem('installDismissed', false)) {
    deferredInstallPrompt = e
    showInstallBanner()
  }
})

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  navigator.serviceWorker.register('./service-worker.js', { scope: './' }).then(reg => {
    reg.update().catch(() => {})
    reg.addEventListener('updatefound', () => {
      const worker = reg.installing
      if (!worker) return
      worker.addEventListener('statechange', () => {
        if (worker.state === 'installed' && navigator.serviceWorker.controller) {
          worker.postMessage({ type: 'SKIP_WAITING' })
        }
      })
    })
  }).catch(() => {})
  let swReloading = false
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (swReloading) return
    swReloading = true
    location.reload()
  })
}

// Init
const initSettings = getSettings()
if (initSettings.darkMode) {
  initSettings.darkMode = false
  saveSettings(initSettings)
}
if (initSettings.theme && initSettings.theme !== 'default' && !isUnlocked(initSettings.theme)) {
  initSettings.theme = 'default'
  setItem('settings', initSettings)
}
brainState.difficulty = guardDifficulty(initSettings.defaultDifficulty)
medState.difficulty = guardDifficulty(initSettings.defaultDifficulty)
routineState.difficulty = guardDifficulty(initSettings.defaultDifficulty)
applyTheme(initSettings.theme)
applyCompactSidebar(initSettings.compactSidebar)
loadDailyApis()
window.addEventListener('online', () => loadDailyApis(true))
maybeAutoBackup()
if (initSettings.notificationsEnabled) startReminderChecker(getPlanProgress)
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && getSettings().notificationsEnabled) {
    maybeSendPlanReminderFromApp()
  }
})

async function maybeSendPlanReminderFromApp() {
  const { maybeSendPlanReminder, maybeSendSunsetReminder } = await import('./notifications.js')
  maybeSendPlanReminder(getPlanProgress)
  maybeSendSunsetReminder()
}

initCloudSync().catch(() => {})
onCloudStatus(() => {
  if (settingsTab === 'account' && getLastRenderPath() === '/ajustes') scheduleRender()
})

bindRender(renderCore)
window.render = (immediate) => scheduleRender(!!immediate)
window.navigate = navigate
window.startBrain = startBrain
window.finishBrain = finishBrain
window.startMeditation = startMeditation
window.startRoutine = startRoutine
window.clearMedTimers = clearMedTimers
window.stopMeditationSession = stopMeditationSession
window.brainState = brainState
window.medState = medState

/** Sincroniza estado de pestañas con onclick inline (módulo ES ≠ window) */
;[
  ['mejoraTab', () => mejoraTab, v => { mejoraTab = v }],
  ['settingsTab', () => settingsTab, v => { settingsTab = v }],
  ['viajeTab', () => viajeTab, v => { viajeTab = v }],
  ['metasTab', () => metasTab, v => { metasTab = v }],
  ['profileTab', () => profileTab, v => { profileTab = v }],
  ['diarioSection', () => diarioSection, v => { diarioSection = v }],
  ['editingHabits', () => editingHabits, v => { editingHabits = v }],
].forEach(([name, get, set]) => {
  Object.defineProperty(window, name, { get, set, configurable: true })
})

saveSettings(getSettings())
initLayout()
window.addEventListener('hashchange', () => scheduleRender(true))
scheduleRender(true)
if (shouldShowTour()) setTimeout(() => startTour(), 900)
