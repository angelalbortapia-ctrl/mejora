import {
  PREFIX, SKILLS, DIFFICULTIES, getItem, setItem, getToday, esc,
  getProgress, saveProgress, getLevel, getLevelInfo, getTotalLevel, getRank,
  addXp, recordActivity, getStreak, getStats, updateStats,
  getSettings, saveSettings, getHabits, getHabitProgress, completeHabit, uncompleteHabit,
  incrementHabit, decrementHabit, getHabitCount, isHabitComplete, getCompletedHabitsCount,
  setRecord, getAchievements,
  ensureDailyPlan, getPlanProgress, checkPlanTask, isRoutineDoneToday, getWeekNumber,
  GOAL_TEMPLATES, getGoals, addGoal, syncGoals, getHabitWeekChart,
  needsOnboarding, migrateOnboardingFlag, MOODS, getMood, setMood, getMoodWeek, getMoodInsight,
  getStreakShieldStatus, resetAllData,
} from './core.js'
import { medState, MED_DURATIONS, stopMeditationSession, syncMeditationFromRoute, getBreathPhaseMs } from './meditation-service.js?v=143'
import { renderMeditationPage, bindMeditationGlobals } from './pages/meditation.js?v=143'
import {
  UNLOCKS, THEMES, isUnlocked, getUnlocked, getNextUnlock,
  checkNewUnlocks, markUnlockSeen, applyTheme,
} from './unlocks.js'
import { getDailyBundle, ensureDailyBundle, buildLocalBundle, formatWeather } from './apis.js'
import {
  canUseNotifications, getNotificationPermission, requestNotificationPermission,
  startReminderChecker,
} from './notifications.js'
import { initLayout, setActiveNav, updateSidebarStats, updateTopBanner, applyCompactSidebar } from './layout.js?v=143'
import { celebrate, updateAppShell } from './fx.js?v=143'
import { playClick, playSuccess } from './sounds.js'
import {
  bindRender, scheduleRender, navigate, parsePath,
  getLastRenderPath, setLastRenderPath,
} from './router.js'
import { onboarding, renderOnboardingOverlay, resetOnboardingCache, TOTAL_ONBOARD_STEPS } from './onboarding-ui.js?v=143'
import { renderHome, bindHomeGlobals } from './pages/home.js?v=143'
import { initLessonReaderScroll } from './brain-academy.js?v=143'
import { startTour, shouldShowTour } from './tour.js?v=143'
import { maybeAutoBackup } from './backup.js'
import { initCloudSync, onCloudStatus } from './cloud-sync.js'
import { stopAmbientSound, isAmbientPlaying } from './ambient-audio.js?v=143'
import { awardXp, processPlanAwards, showToast } from './awards.js'
import { moodPickerHTML, heatmapHTML, skillBars, guardDifficulty } from './page-helpers.js'
import { routineState, stopRoutineIfLeaving, patchRoutineUI } from './routine-service.js'
import { pomodoro, patchPomodoroUI } from './focus-service.js'
import { renderRoutine, bindRoutineGlobals } from './pages/routine.js?v=143'
import { renderPlan, renderSoloHoy } from './pages/plan.js?v=143'
import { renderMejora, bindMejoraGlobals, getEditingHabits, setEditingHabits } from './pages/mejora.js?v=143'
import { renderEnfoque, bindEnfoqueGlobals } from './pages/enfoque.js?v=143'
import { renderSettings, bindSettingsGlobals, getSettingsTab, setSettingsTab } from './pages/settings.js?v=143'
import { maybeAutoSectionGuide, startSectionGuide } from './section-guides.js?v=143'
import { renderViaje, getViajeTab, setViajeTab, bindJourneyGlobals } from './pages/journey.js?v=143'
import { renderMetas, bindGoalsGlobals, getMetasTab, setMetasTab } from './pages/goals.js?v=143'
import { renderProfile, getProfileTab, setProfileTab } from './pages/profile.js?v=143'
import {
  renderBrainGym, bindBrainGymGlobals, clearEphemeralBrainState, syncGimnasiaRoute, patchBrainExerciseUI, patchGimnasiaHubUI, syncBrainSynapseFx, brainState,
} from './pages/brain-gym.js?v=143'
import { ensureGeminiConfig } from './gemini-config.js'
import { ensureAzureConfig } from './azure-config.js'
import { ensureFishConfig } from './fish-config.js'


// --- State ---
let deferredInstallPrompt = null
let dailyApis = getDailyBundle()
let dailyApisLoading = false

function isHomeLikePath(path) {
  return ['/', '/plan', '/mejora', '/meditacion'].includes(path)
}

async function loadDailyApis(force = false) {
  const country = getSettings().country || 'MX'
  if (!force && dailyApis?.date === getToday() && dailyApis?.country === country && !dailyApis.stale) return
  dailyApisLoading = true
  const path = parsePath().path
  if (isHomeLikePath(path)) scheduleRender()
  try {
    dailyApis = await ensureDailyBundle(country)
  } catch {
    dailyApis = getDailyBundle() || buildLocalBundle(country)
  }
  dailyApisLoading = false
  if (isHomeLikePath(parsePath().path)) scheduleRender()
}

function renderHomePage() {
  return renderHome({ moodPickerHTML, dailyApis, dailyApisLoading })
}

const renderPlanPage = () => renderPlan(dailyApis)


function renderMeditation() {
  return renderMeditationPage(dailyApis)
}

// --- Router ---
const routes = {
  '/': renderHomePage, '/plan': renderPlanPage, '/rutina': renderRoutine, '/gimnasia': renderBrainGym,
  '/meditacion': renderMeditation, '/mejora': renderMejora, '/enfoque': renderEnfoque,
  '/ajustes': renderSettings, '/perfil': renderProfile, '/desafios': renderPlanPage,
  '/metas': renderMetas, '/viaje': renderViaje, '/hoy': renderSoloHoy,
}

window.setOnboardGoal = function(i) { onboarding.goal = i; render() }

window.toggleOnboardHabit = function(id) {
  if (onboarding.selectedHabits.includes(id)) onboarding.selectedHabits = onboarding.selectedHabits.filter(h => h !== id)
  else if (onboarding.selectedHabits.length < 3) onboarding.selectedHabits.push(id)
  playClick()
  render()
}

window.onboardBack = function() {
  if (onboarding.step <= 0) return
  onboarding.step--
  resetOnboardingCache()
  playClick()
  render()
}

window.onboardNext = function() {
  if (onboarding.step === 1) {
    const name = document.getElementById('onboard-name')?.value?.trim()
    const s = getSettings()
    s.userName = name || ''
    saveSettings(s)
  }
  if (onboarding.step === 4) {
    const s = getSettings()
    const country = document.getElementById('onboard-country')?.value
    const reminder = document.getElementById('onboard-reminder')?.value
    const sound = document.getElementById('onboard-sound')?.checked
    const motion = document.getElementById('onboard-motion')?.checked
    if (country) s.country = country
    s.reminderHour = reminder ? parseInt(reminder) : s.reminderHour
    s.sound = sound !== false
    s.reducedMotion = !!motion
    saveSettings(s)
    document.documentElement.classList.toggle('reduce-motion', !!motion)
  }
  if (onboarding.step === 5) {
    const all = getHabits()
    const selected = all.filter(h => onboarding.selectedHabits.includes(h.id))
    setItem('habits', selected.length ? selected : all.slice(0, 3))
  }
  if (onboarding.step >= TOTAL_ONBOARD_STEPS - 1) return
  onboarding.step++
  resetOnboardingCache()
  playClick()
  render()
}

window.finishOnboarding = async function() {
  if (onboarding.goal !== null) addGoal(GOAL_TEMPLATES[onboarding.goal])
  const s = getSettings()
  s.onboardingComplete = true
  onboarding.forced = false
  if (s.reminderHour && !s.notificationsEnabled) {
    const perm = await requestNotificationPermission()
    if (perm === 'granted') s.notificationsEnabled = true
  }
  saveSettings(s)
  if (s.notificationsEnabled) startReminderChecker(getPlanProgress)
  onboarding.step = 0
  resetOnboardingCache()
  document.body.classList.remove('onboarding-open')
  playSuccess()
  celebrate()
  showToast('¡Tu viaje comienza!', 0, 'discipline')
  location.hash = '/plan'
  render(true)
  setTimeout(() => { if (shouldShowTour()) startTour() }, 800)
}

function patchLiveUI(path) {
  if (path === '/meditacion' && (medState.session || medState.freeTimer?.active) && !medState.completed) {
    const timerEl = document.getElementById('med-timer')
    if (!timerEl) return false
    if (medState.freeTimer?.active) {
      const ft = medState.freeTimer
      const elapsed = ft.elapsed
      const target = ft.open ? null : ft.targetMin * 60
      const remaining = target ? target - elapsed : elapsed
      const mins = Math.floor(Math.max(0, remaining) / 60)
      const secs = (Math.max(0, remaining) % 60).toString().padStart(2, '0')
      timerEl.textContent = `${mins}:${secs}`
      return true
    }
    const total = medState.totalSec || MED_DURATIONS[medState.difficulty] * 60
    const remaining = total - medState.elapsed
    const mins = Math.floor(remaining / 60)
    const secs = (remaining % 60).toString().padStart(2, '0')
    if (medState.session === 'breathing' || medState.session === 'box-breath') {
      const scale = medState.phase === 'inhale' ? 1.2 : medState.phase === 'exhale' ? 0.8 : 1.1
      const phase = { inhale: 'Inhala', hold: 'Mantén', exhale: 'Exhala' }
      const phaseEl = document.getElementById('med-phase-text')
      const circleEl = document.getElementById('med-breathe-circle')
      if (!phaseEl || !circleEl) return false
      timerEl.textContent = `${mins}:${secs}`
      phaseEl.textContent = phase[medState.phase]
      const breathSec = getBreathPhaseMs() / 1000
      circleEl.style.transition = `transform ${breathSec}s ease-in-out`
      circleEl.style.transform = `scale(${scale})`
    } else {
      const steps = medState.steps || []
      const step = steps[medState.step]
      const stepEl = document.getElementById('med-step-text')
      const cueEl = document.querySelector('.calma-step-cue')
      const progressEl = document.getElementById('med-progress-fill')
      if (!stepEl || !progressEl) return false
      timerEl.textContent = `${mins}:${secs} · Paso ${medState.step + 1}/${steps.length}`
      progressEl.style.width = `${(medState.elapsed / total) * 100}%`
      const subFill = document.querySelector('.calma-step-subprogress-fill')
      if (subFill && step?.duration) subFill.style.width = `${Math.min(100, (medState.stepElapsed / step.duration) * 100)}%`
      import('./meditation-voice.js?v=143').then(({ getStepInstructionText, getStepCueText }) => {
        const instruction = getStepInstructionText(step)
        const cue = getStepCueText(step)
        if (cueEl) cueEl.textContent = cue
        if (stepEl.textContent !== instruction) {
          stepEl.textContent = instruction
          import('./meditation-fx.js?v=143').then(m => m.pulseCalmaStep?.(medState.step)).catch(() => {})
        }
      }).catch(() => {})
    }
    return true
  }
  if (path === '/enfoque' && patchPomodoroUI()) return true
  if (path === '/gimnasia' && patchGimnasiaHubUI()) return true
  if (path === '/gimnasia' && brainState.exercise && patchBrainExerciseUI()) return true
  if (path === '/rutina' && patchRoutineUI()) return true
  return false
}

function syncRouteFromHash() {
  const { path, sub } = parsePath()
  if (path === '/gimnasia') syncGimnasiaRoute(sub)
  if (path === '/meditacion') syncMeditationFromRoute(sub)
}

function renderCore() {
  const { path, sub, full } = parsePath()
  syncRouteFromHash()
  const prevRoute = getLastRenderPath()
  const prevPath = parsePath(`#${prevRoute || '/'}`).path
  if (prevPath === '/gimnasia' && path !== '/gimnasia') clearEphemeralBrainState()
  if (prevPath === '/rutina' && path !== '/rutina') stopRoutineIfLeaving(path)
  if (path !== '/meditacion') {
    const medActive = medState.session || medState.freeTimer?.active
    if (medActive && !medState.completed) {
      stopMeditationSession()
      medState.session = null
      medState.completed = false
      medState.view = 'hub'
    } else if (medActive && medState.completed) {
      medState.session = null
      medState.completed = false
      medState.view = 'hub'
    } else if (medState.ambientPreview || isAmbientPlaying()) {
      stopAmbientSound()
      medState.ambientPreview = false
    }
  }
  const content = document.getElementById('app-content')
  const routeKey = full || '/'
  const sameRoute = routeKey === prevRoute
  const livePatch = sameRoute && patchLiveUI(path)

  if (livePatch) {
    content.classList.add('route-stable')
    content.classList.remove('route-enter')
    return
  }

  content.classList.remove('route-stable', 'route-enter')
  try {
    content.innerHTML = (routes[path] || routes['/'])()
  } catch (err) {
    console.error('[Mejora] render error', path, err)
    content.innerHTML = `<div class="card" style="max-width:28rem;margin:2rem auto;padding:1.5rem">
      <h2 style="margin:0 0 0.5rem">Algo falló al cargar esta vista</h2>
      <p style="margin:0 0 1rem;line-height:1.5;color:var(--m-muted)">Recarga con <strong>Cmd+Shift+R</strong>. Si abriste <code>index.html</code> directo, usa el servidor local.</p>
      <pre style="font-size:0.75rem;overflow:auto;padding:0.75rem;background:var(--m-surface-2,#f5f5f5);border-radius:8px">${esc(String(err.message || err))}</pre>
      <button type="button" class="btn-primary mt-4" onclick="location.reload()">Recargar</button>
    </div>`
  }
  if (!sameRoute) {
    requestAnimationFrame(() => content.classList.add('route-enter'))
    setLastRenderPath(routeKey)
    maybeAutoSectionGuide(path)
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
    rankLevel: rank.min,
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
    lessonReader: !!brainState.activeLesson && path === '/gimnasia',
  })
  if (brainState.activeLesson && path === '/gimnasia') {
    requestAnimationFrame(() => initLessonReaderScroll?.())
  }
  if (path === '/gimnasia') {
    requestAnimationFrame(() => syncBrainSynapseFx())
  } else if (prevPath === '/gimnasia') {
    import('./brain-synapse-fx.js?v=143').then(m => m.unmountSynapseField?.()).catch(() => {})
  }
  if (path === '/meditacion') {
    import('./meditation-fx.js?v=143').then(m => {
      requestAnimationFrame(() => {
        if (medState.completed) m.initCalmaCompleteFX?.()
        else if (medState.session || medState.freeTimer?.active) m.initCalmaSessionFX?.()
        else if (medState.view === 'program') m.initCalmaProgramFX?.()
        else m.initCalmaHubFX?.()
        m.bindCalmaCardHaptics?.()
        m.bindCalmaCardTilt?.()
      })
    }).catch(() => {})
  } else if (prevPath === '/meditacion') {
    import('./meditation-fx.js?v=143').then(m => m.stopCalmaFx?.()).catch(() => {})
  }
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
  navigator.serviceWorker.register('./service-worker.js?v=143', { scope: './' }).then(reg => {
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

function showWrongServerBanner() {
  if (document.getElementById('mejora-server-banner')) return
  const box = document.createElement('div')
  box.id = 'mejora-server-banner'
  box.setAttribute('role', 'alert')
  box.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:10000;padding:0.85rem 1rem;background:#3a1518;border-bottom:1px solid #c45c5c;color:#f5d6d6;font:500 0.92rem/1.45 system-ui,sans-serif;text-align:center'
  box.innerHTML = 'La voz de Calma no funciona con este servidor. Cierra la pestaña, abre <strong>Mejora.app</strong> de nuevo o ejecuta <strong>start-server.command</strong>.'
  document.body.prepend(box)
}

// Init
async function applyVoiceConfigDefaults() {
  await Promise.all([ensureGeminiConfig(), ensureAzureConfig(), ensureFishConfig()])
  const { FISH_VOICE_ID } = await import('./fish-config.js')
  const { hasAzureTts } = await import('./azure-tts.js?v=143')
  const { hasFishTts, probeFishProxy } = await import('./fish-audio-tts.js?v=143')
  const proxyOk = await probeFishProxy()
  if (!proxyOk && (location.hostname === '127.0.0.1' || location.hostname === 'localhost')) {
    showWrongServerBanner()
  }
  const s = getSettings()
  if (s.medVoiceEngine === 'fish' && !hasFishTts()) {
    s.medVoiceEngine = 'browser'
    saveSettings(s)
  }
  if (FISH_VOICE_ID && !s.fishVoiceId) {
    s.fishVoiceId = FISH_VOICE_ID
    saveSettings(s)
  }
  if (s.fishSpeed === 0.82) {
    s.fishSpeed = 0.96
    saveSettings(s)
  }
  if (hasFishTts()) {
    s.medVoiceEngine = 'fish'
    saveSettings(s)
  }
  if (s.medVoiceEngine === 'gemini') {
    if (hasFishTts()) s.medVoiceEngine = 'fish'
    else if (hasAzureTts()) s.medVoiceEngine = 'azure'
    saveSettings(s)
  } else if (!s.medVoiceEngine) {
    if (hasFishTts()) s.medVoiceEngine = 'fish'
    else if (hasAzureTts()) {
      s.medVoiceEngine = 'azure'
      if (!s.azureSpeechRegion) s.azureSpeechRegion = 'eastus'
      if (!s.azureVoice) s.azureVoice = 'es-MX-DaliaNeural'
    }
    saveSettings(s)
  } else if (s.medVoiceEngine !== 'browser' && s.medVoiceEngine !== 'fish' && s.medVoiceEngine !== 'azure' && s.medVoiceEngine !== 'gemini') {
    s.medVoiceEngine = hasFishTts() ? 'fish' : hasAzureTts() ? 'azure' : 'browser'
    saveSettings(s)
  }
  scheduleRender()
}
applyVoiceConfigDefaults()
window.addEventListener('mejora:gemini-ready', () => scheduleRender())
window.addEventListener('mejora:azure-ready', () => applyVoiceConfigDefaults())
window.addEventListener('mejora:fish-ready', () => applyVoiceConfigDefaults())

migrateOnboardingFlag()
const initSettings = getSettings()
document.documentElement.classList.remove('dark')
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
  if (getSettingsTab() === 'account' && getLastRenderPath() === '/ajustes') scheduleRender()
})

bindMeditationGlobals()
bindRoutineGlobals()
bindMejoraGlobals()
bindEnfoqueGlobals()
bindJourneyGlobals()
bindGoalsGlobals()
bindHomeGlobals({ startGuide: startSectionGuide })
bindBrainGymGlobals()
bindSettingsGlobals({
  invalidateDailyApis: () => { dailyApis = null },
  reloadDailyApis: () => loadDailyApis(true),
})
bindRender(renderCore)
window.render = (immediate) => scheduleRender(!!immediate)
window.navigate = navigate
window.patchLiveUI = patchLiveUI
window.processPlanAwards = processPlanAwards
window.medState = medState

/** Sincroniza estado de pestañas con onclick inline (módulo ES ≠ window) */
;[
  ['settingsTab', getSettingsTab, setSettingsTab],
  ['viajeTab', getViajeTab, setViajeTab],
  ['metasTab', getMetasTab, setMetasTab],
  ['profileTab', getProfileTab, setProfileTab],
  ['editingHabits', getEditingHabits, setEditingHabits],
  ['schoolFaculty', () => brainState.schoolFaculty, v => { brainState.schoolFaculty = v }],
  ['trainSection', () => brainState.trainSection, v => { brainState.trainSection = v }],
  ['bodySection', () => brainState.bodySection, v => { brainState.bodySection = v }],
  ['schoolSection', () => brainState.schoolSection, v => { brainState.schoolSection = v }],
  ['brainView', () => brainState.brainView, v => { brainState.brainView = v }],
].forEach(([name, get, set]) => {
  Object.defineProperty(window, name, { get, set, configurable: true })
})

initLayout()
import('./global-search.js?v=143').then(m => m.mountGlobalSearch?.()).catch(() => {})
window.addEventListener('hashchange', () => scheduleRender(true))
scheduleRender(true)
if (shouldShowTour() && ['/', '/plan'].includes(parsePath().path)) {
  setTimeout(() => startTour(), 900)
}
