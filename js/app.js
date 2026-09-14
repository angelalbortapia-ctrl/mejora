/* global render */
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
} from '/js/core.js'
import { ASSET_VERSION } from '/js/version.js'
import { medState, MED_DURATIONS, stopMeditationSession, syncMeditationFromRoute, getBreathPhaseMs } from '/js/meditation-service.js'
import { renderMeditationPage, bindMeditationGlobals } from '/js/pages/meditation.js'
import {
  UNLOCKS, THEMES, isUnlocked, getUnlocked, getNextUnlock,
  checkNewUnlocks, markUnlockSeen, applyTheme,
} from '/js/unlocks.js'
import { getDailyBundle, ensureDailyBundle, buildLocalBundle, formatWeather } from '/js/apis.js'
import {
  canUseNotifications, getNotificationPermission, requestNotificationPermission,
  startReminderChecker,
} from '/js/notifications.js'
import { initLayout, setActiveNav, updateSidebarStats, updateTopBanner, applyCompactSidebar, remountNav } from '/js/layout.js'
import { initI18n, setLocale } from '/js/i18n.js'
import { trackProductEvent, EVENTS } from '/js/product-analytics.js'
import { celebrate, updateAppShell } from '/js/fx.js'
import { playClick, playSuccess } from '/js/sounds.js'
import {
  bindRender, scheduleRender, navigate, parsePath,
  getLastRenderPath, setLastRenderPath,
} from '/js/router.js'
import { onboarding, renderOnboardingOverlay, resetOnboardingCache, TOTAL_ONBOARD_STEPS } from '/js/onboarding-ui.js'
import { renderHome, bindHomeGlobals } from '/js/pages/home.js'
import { initLessonReaderScroll } from '/js/brain-academy.js'
import { startTour, shouldShowTour } from '/js/tour.js'
import { maybeAutoBackup } from '/js/backup.js'
import { initCloudSync, onCloudStatus } from '/js/cloud-sync.js'
import { stopAmbientSound, isAmbientPlaying } from '/js/ambient-audio.js'
import { awardXp, processPlanAwards, showToast, showUpdateToast } from '/js/awards.js'
import { moodPickerHTML, heatmapHTML, skillBars, guardDifficulty } from '/js/page-helpers.js'
import { routineState, stopRoutineIfLeaving, patchRoutineUI } from '/js/routine-service.js'
import { pomodoro, patchPomodoroUI } from '/js/focus-service.js'
import { renderRoutine, bindRoutineGlobals } from '/js/pages/routine.js'
import { renderPlan, renderSoloHoy, bindPlanGlobals } from '/js/pages/plan.js'
import { renderMejora, bindMejoraGlobals, getEditingHabits, setEditingHabits } from '/js/pages/mejora.js'
import { renderEnfoque, bindEnfoqueGlobals } from '/js/pages/enfoque.js'
import { renderSettings, bindSettingsGlobals, getSettingsTab, setSettingsTab } from '/js/pages/settings.js'
import { maybeAutoSectionGuide, startSectionGuide } from '/js/section-guides.js'
import { renderViaje, getViajeTab, setViajeTab, bindJourneyGlobals } from '/js/pages/journey.js'
import { bindMoodTrackerGlobals } from '/js/modules/mood-tracker.js'
import { renderMetas, bindGoalsGlobals, getMetasTab, setMetasTab } from '/js/pages/goals.js'
import { renderProfile, getProfileTab, setProfileTab, bindProfileGlobals } from '/js/pages/profile.js'
import {
  renderBrainGym, bindBrainGymGlobals, clearEphemeralBrainState, syncGimnasiaRoute, patchBrainExerciseUI, patchGimnasiaHubUI, syncBrainSynapseFx, brainState,
} from '/js/pages/brain-gym.js'
import { ensureGeminiConfig } from '/js/gemini-config.js'
import { ensureAzureConfig } from '/js/azure-config.js'
import { ensureFishConfig } from '/js/fish-config.js'
import { renderClassRoute, bindClassGlobals } from '/js/class-pages.js'


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
  '/ajustes': renderSettings, '/perfil': renderProfile,
  '/metas': renderMetas, '/viaje': renderViaje, '/hoy': renderSoloHoy,
  '/clase': () => renderClassRoute(parsePath().sub),
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
  render(true)
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
  render(true)
}

window.skipOnboarding = function() {
  const s = getSettings()
  s.onboardingComplete = true
  onboarding.forced = false
  saveSettings(s)
  onboarding.step = 0
  resetOnboardingCache()
  document.body.classList.remove('onboarding-open')
  playClick()
  render(true)
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
      import('/js/meditation-voice.js').then(({ getStepInstructionText, getStepCueText }) => {
        const instruction = getStepInstructionText(step)
        const cue = getStepCueText(step)
        if (cueEl) cueEl.textContent = cue
        if (stepEl.textContent !== instruction) {
          stepEl.textContent = instruction
          import('/js/meditation-fx.js').then(m => m.pulseCalmaStep?.(medState.step)).catch(() => {})
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

function applyRenderChrome(path, prevPath, sameRoute) {
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
  if (path === '/' || path === '/hoy' || path === '/gimnasia') {
    import('/js/brain-program.js').then(m => {
      m.refreshAdaptiveMission().then(() => {
        const slot = document.getElementById('adaptive-mission-card')
        if (slot) slot.outerHTML = m.renderAdaptiveMissionCard()
      }).catch(() => {})
    }).catch(() => {})
  }
  if (path === '/gimnasia') {
    requestAnimationFrame(() => syncBrainSynapseFx())
  } else if (prevPath === '/gimnasia') {
    import('/js/brain-synapse-fx.js').then(m => m.unmountSynapseField?.()).catch(() => {})
  }
  if (path === '/meditacion') {
    import('/js/meditation-fx.js').then(m => {
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
    import('/js/meditation-fx.js').then(m => m.stopCalmaFx?.()).catch(() => {})
  }
}

const HARF_THEME_COLOR = '#ffffff'
const DEFAULT_THEME_COLOR = '#ffffff'

function syncHarfAppearance(path) {
  const isHarf = path === '/clase'
  document.body.classList.toggle('harf-linear', isHarf)
  document.documentElement.style.colorScheme = isHarf ? 'light only' : ''
  if (isHarf) document.documentElement.classList.remove('dark')
  const themeMeta = document.querySelector('meta[name="theme-color"]')
  if (themeMeta) themeMeta.setAttribute('content', isHarf ? HARF_THEME_COLOR : DEFAULT_THEME_COLOR)
}

function renderCore() {
  const { path, sub, full } = parsePath()
  syncHarfAppearance(path)
  if (path === '/desafios') {
    location.replace('#/plan')
    return
  }
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

  if (path === '/gimnasia' && brainState.exercise && document.getElementById('brain-lab-runtime')) {
    applyRenderChrome(path, prevPath, sameRoute)
    return
  }

  const livePatch = sameRoute && patchLiveUI(path)

  if (livePatch) {
    content.classList.add('route-stable')
    content.classList.remove('route-enter')
  } else {
    content.classList.remove('route-stable', 'route-enter')
    try {
      content.innerHTML = (routes[path] || routes['/'])()
    } catch (err) {
      console.error('[Mejora] render error', path, err)
      content.innerHTML = `<div class="card" style="max-width:28rem;margin:2rem auto;padding:1.5rem">
        <h2 style="margin:0 0 0.5rem">Algo falló al cargar esta vista</h2>
        <p style="margin:0 0 1rem;line-height:1.5;color:var(--m-muted)">Recarga con <strong>Cmd+Shift+R</strong>. Si abriste <code>index.html</code> directo, usa el servidor local.</p>
        <pre style="font-size:0.75rem;overflow:auto;padding:0.75rem;background:var(--m-surface-2,#1a2029);border-radius:8px;color:var(--m-muted,#8a8480)">${esc(String(err.message || err))}</pre>
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
  }

  applyRenderChrome(path, prevPath, sameRoute)
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
  let waitingWorker = null
  let swReloadPending = false

  async function fetchRemoteAssetVersion() {
    const res = await fetch(`./js/version.js?_=${Date.now()}`, { cache: 'no-store' })
    const text = await res.text()
    const m = text.match(/ASSET_VERSION\s*=\s*(\d+)/)
    return m ? Number(m[1]) : null
  }

  async function applyPendingAppUpdate() {
    swReloadPending = true
    const reg = await navigator.serviceWorker.getRegistration()
    if (reg?.waiting) reg.waiting.postMessage({ type: 'SKIP_WAITING' })
    else location.reload()
  }

  async function checkForNewAssetVersion() {
    try {
      const remote = await fetchRemoteAssetVersion()
      if (remote && remote > ASSET_VERSION) await applyPendingAppUpdate()
    } catch { /* sin red */ }
  }

  navigator.serviceWorker.register(`./service-worker.js?v=${ASSET_VERSION}`, { scope: './' }).then(reg => {
    reg.update().catch(() => {})
    reg.addEventListener('updatefound', () => {
      const worker = reg.installing
      if (!worker) return
      worker.addEventListener('statechange', () => {
        if (worker.state === 'installed' && navigator.serviceWorker.controller) {
          waitingWorker = worker
          fetchRemoteAssetVersion().then(remote => {
            if (remote && remote > ASSET_VERSION) {
              applyPendingAppUpdate()
              return
            }
            showUpdateToast(() => {
              swReloadPending = true
              waitingWorker?.postMessage({ type: 'SKIP_WAITING' })
            })
          }).catch(() => {
            showUpdateToast(() => {
              swReloadPending = true
              waitingWorker?.postMessage({ type: 'SKIP_WAITING' })
            })
          })
        }
      })
    })
  }).catch(() => {})

  navigator.serviceWorker.addEventListener('message', (e) => {
    if (e.data?.type === 'APP_UPDATED' && Number(e.data.version) > ASSET_VERSION) {
      applyPendingAppUpdate()
    }
  })
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (swReloadPending) location.reload()
  })
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') checkForNewAssetVersion()
  })
  checkForNewAssetVersion()
}

function showWrongServerBanner() {
  if (document.getElementById('mejora-server-banner')) return
  const port = location.port || (location.protocol === 'https:' ? '443' : '80')
  const correctUrl = `http://127.0.0.1:5173/?v=${ASSET_VERSION}`
  const onDevPort = port === '5173'
  const hint = onDevPort
    ? 'En :5173 hace falta <strong>mejora-dev-server.py</strong> (no <code>python -m http.server</code>). Cierra el servidor actual y vuelve a ejecutar <strong>start-server.command</strong>. Revisa <code>js/fish-config.local.js</code>.'
    : `Abre <a href="${correctUrl}" style="color:#ffd4d4;text-decoration:underline">127.0.0.1:5173</a> o ejecuta <strong>start-server.command</strong> / <strong>Mejora.app</strong>.`
  const box = document.createElement('div')
  box.id = 'mejora-server-banner'
  box.setAttribute('role', 'alert')
  box.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:10000;padding:0.85rem 1rem;background:#3a1518;border-bottom:1px solid #c45c5c;color:#f5d6d6;font:500 0.92rem/1.45 system-ui,sans-serif;text-align:center'
  box.innerHTML = `La voz de Calma no está disponible (puerto <strong>${port}</strong>). ${hint} <button type="button" id="mejora-server-retry" style="margin-left:0.5rem;padding:0.2rem 0.55rem;border:1px solid #c45c5c;border-radius:6px;background:transparent;color:#ffd4d4;cursor:pointer">Reintentar</button>`
  document.body.prepend(box)
  document.getElementById('mejora-server-retry')?.addEventListener('click', async () => {
    const { probeFishProxy } = await import('/js/fish-audio-tts.js')
    if (await probeFishProxy()) {
      box.remove()
      applyVoiceConfigDefaults()
    }
  })
}

// Init
async function applyVoiceConfigDefaults() {
  await Promise.all([ensureGeminiConfig(), ensureAzureConfig(), ensureFishConfig()])
  const { FISH_VOICE_ID } = await import('/js/fish-config.js')
  const { hasAzureTts } = await import('/js/azure-tts.js')
  const { hasFishTts, probeFishProxy } = await import('/js/fish-audio-tts.js')
  const proxyOk = await probeFishProxy()
  const onLocal = location.hostname === '127.0.0.1' || location.hostname === 'localhost'
  if (!proxyOk && onLocal) showWrongServerBanner()
  else document.getElementById('mejora-server-banner')?.remove()
  const s = getSettings()
  // No bajar a browser por fallo temporal del proxy — getActiveMedVoiceEngine ya hace fallback.
  if (proxyOk && s.medVoiceEngine === 'browser' && hasFishTts()) {
    s.medVoiceEngine = 'fish'
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
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') applyVoiceConfigDefaults()
})

migrateOnboardingFlag()
initI18n()
trackProductEvent(EVENTS.APP_OPEN)
window.addEventListener('mejora:locale', () => {
  remountNav()
  scheduleRender(true)
})
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
  const { maybeSendPlanReminder, maybeSendSunsetReminder } = await import('/js/notifications.js')
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
bindMoodTrackerGlobals()
bindProfileGlobals()
bindGoalsGlobals()
bindHomeGlobals({ startGuide: startSectionGuide })
bindPlanGlobals()
bindBrainGymGlobals()
bindClassGlobals()
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
import('/js/global-search.js').then(m => m.mountGlobalSearch?.()).catch(() => {})
window.addEventListener('hashchange', () => scheduleRender(true))
scheduleRender(true)
if (shouldShowTour() && ['/', '/plan'].includes(parsePath().path)) {
  setTimeout(() => startTour(), 900)
}
