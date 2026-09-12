/** Página Calma — hub, sesiones, programas, timer libre, sueño */

import { esc, getSettings, saveSettings, DIFFICULTIES } from '../core.js'
import { isUnlocked } from '../unlocks.js'

function guardDifficulty(d) {
  return d === 'experto' && !isUnlocked('diff_expert') ? 'medio' : d
}
import { MEDITATIONS, MEDITATION_PROGRAMS } from '../meditations.js?v=78'
import {
  medState, MED_DURATIONS, clearMedTimers, stopMeditationSession,
  startMeditation, startFreeTimer, finishFreeTimer,
  getMeditationStats, getMeditationStreak, getProgramProgress, startMeditationProgram,
  getProgramSessionForToday, getSleepStats, getSleepLog, logSleep, getBreathCoherenceLog,
  medAmbientVol,
} from '../meditation-service.js'
import { AMBIENT_PRESETS, startAmbientSound, stopAmbientSound, isAmbientPlaying, resumeAudioContext } from '../ambient-audio.js'
import { sunsetBannerHTML } from '../apis.js'
import { icon } from '../icons.js'

function difficultyPicker(current, setter) {
  return `<div class="med-diff-row" role="group" aria-label="Dificultad">
    ${Object.entries(DIFFICULTIES).map(([k, d]) =>
      `<button type="button" onclick="${setter}('${k}')" class="btn-secondary ${current === k ? 'is-active' : ''}" aria-pressed="${current === k}">${d.icon} ${d.label}</button>`
    ).join('')}
  </div>`
}

function pageHero(title, sub, stat, statLabel) {
  return `<header class="page-hero med-hero">
    <div class="page-hero__body">
      <p class="page-hero__kicker">Calma</p>
      <h2 class="page-hero__title">${title}</h2>
      <p class="page-hero__sub">${sub}</p>
    </div>
    <div class="page-hero__stat"><span class="page-hero__stat-val">${stat}</span><span class="page-hero__stat-label">${statLabel}</span></div>
  </header>`
}

function medAmbientPanelHTML(compact = false) {
  const s = getSettings()
  const vol = Math.round((s.medAmbientVolume ?? 0.45) * 100)
  const current = s.medAmbient || 'rain'
  const isSilent = current === 'off'
  const playing = isAmbientPlaying()
  return `<div class="med-ambient-panel ${compact ? 'med-ambient-panel--compact' : ''}">
    <div class="med-ambient-head">
      <span class="med-ambient-title">${compact ? 'Ambiente' : 'Sonido ambiente · incluye binaural suave (ruido marrón)'}</span>
      ${playing ? '<span class="med-ambient-live">● Activo</span>' : isSilent ? '<span class="med-ambient-muted">Silencio</span>' : ''}
    </div>
    <div class="med-ambient-types">
      ${AMBIENT_PRESETS.map(p => `
        <button type="button" onclick="setMedAmbient('${p.id}')" class="med-ambient-btn ${current === p.id ? 'active' : ''}" title="${p.label}" aria-pressed="${current === p.id}">
          <span class="med-ambient-btn-label">${p.label}</span>
        </button>`).join('')}
    </div>
    <label class="med-ambient-slider ${isSilent ? 'med-ambient-slider--off' : ''}">
      <span class="text-xs text-muted">Volumen</span>
      <input type="range" min="0" max="100" value="${isSilent ? 0 : vol}" ${isSilent ? 'disabled' : ''}
        oninput="setMedAmbientVol(Number(this.value)/100)" class="med-ambient-range" aria-label="Volumen ambiente">
      <span id="med-ambient-vol-pct" class="text-xs text-muted">${isSilent ? '—' : `${vol}%`}</span>
    </label>
    <label class="med-voice-toggle">
      <input type="checkbox" ${medState.voiceEnabled ? 'checked' : ''} onchange="toggleMedVoice(this.checked)" aria-label="Narrador de voz">
      <span>Narrador de voz (sistema)</span>
    </label>
  </div>`
}

function statsBar() {
  const st = getMeditationStats()
  const coherence = getBreathCoherenceLog()
  const lastCoherence = coherence.length ? coherence[coherence.length - 1].score : '—'
  return `<div class="med-stats-bar">
    <div class="med-stat"><span class="med-stat-val">${st.streak}</span><span class="med-stat-label">racha calma</span></div>
    <div class="med-stat"><span class="med-stat-val">${st.sessions}</span><span class="med-stat-label">sesiones</span></div>
    <div class="med-stat"><span class="med-stat-val">${st.minutes}</span><span class="med-stat-label">min totales</span></div>
    <div class="med-stat"><span class="med-stat-val">${lastCoherence}</span><span class="med-stat-label">coherencia</span></div>
  </div>`
}

function programsHTML() {
  return `<section class="m-section med-programs">
    <h2 class="m-section-title">Programas</h2>
    <div class="med-program-grid">
      ${MEDITATION_PROGRAMS.map(p => {
        const prog = getProgramProgress(p.id)
        return `<button type="button" class="med-program-card" onclick="startMedProgram('${p.id}')">
          <span class="med-program-days">${p.days} días</span>
          <span class="med-program-name">${p.name}</span>
          <span class="med-program-desc">${p.desc}</span>
          <span class="med-program-progress">${prog.completed}/${p.days} · ${prog.percent}%</span>
        </button>`
      }).join('')}
    </div>
  </section>`
}

function programViewHTML() {
  const id = medState.activeProgram
  const prog = getProgramProgress(id)
  if (!prog) return ''
  const todaySession = getProgramSessionForToday(id)
  return `<div class="card med-program-active">
    <button type="button" class="school-back" onclick="navigate('/meditacion')">← Volver</button>
    <h2 class="font-display text-xl font-bold text-main mt-2">${prog.program.name}</h2>
    <p class="text-sm text-muted mb-4">${prog.completed}/${prog.program.days} días · ${prog.percent}%</p>
    <div class="progress-track w-full mb-4"><div class="progress-fill h-full" style="width:${prog.percent}%"></div></div>
    ${todaySession ? `<p class="text-sm text-main mb-3">Hoy: <strong>${todaySession.name}</strong></p>
      <button type="button" class="btn-primary w-full" onclick="startMeditation('${todaySession.id}')">Iniciar sesión del día</button>`
      : `<p class="text-sm text-muted">Programa completado. Elige otro o repite.</p>`}
  </div>`
}

function sleepViewHTML() {
  const stats = getSleepStats()
  const log = getSleepLog()
  const today = Object.keys(log).slice(-7).reverse()
  return `<div class="card med-sleep-panel">
    <button type="button" class="school-back" onclick="navigate('/meditacion')">← Volver</button>
    <h2 class="font-display text-xl font-bold text-main mt-2">Registro de sueño</h2>
    <p class="text-sm text-muted mb-4">Promedio: ${stats.avgHours}h · Calidad ${stats.avgQuality}/5 · ${stats.nights} noches</p>
    <form onsubmit="event.preventDefault();submitSleepLog()" class="med-sleep-form">
      <label class="ds-label">Horas dormidas
        <input type="number" id="sleep-hours" class="ds-input" min="0" max="14" step="0.5" value="7" required>
      </label>
      <label class="ds-label">Calidad (1-5)
        <input type="range" id="sleep-quality" min="1" max="5" value="3" oninput="document.getElementById('sleep-q-val').textContent=this.value">
        <span id="sleep-q-val">3</span>/5
      </label>
      <button type="submit" class="btn-primary w-full">Registrar</button>
    </form>
    ${today.length ? `<ul class="med-sleep-log">${today.map(d => `<li>${d}: ${log[d].hours}h · ${log[d].quality}/5</li>`).join('')}</ul>` : ''}
  </div>`
}

function activeSessionHTML() {
  if (medState.freeTimer?.active) {
    const ft = medState.freeTimer
    const elapsed = ft.elapsed
    const mins = Math.floor(elapsed / 60)
    const secs = (elapsed % 60).toString().padStart(2, '0')
    const target = ft.open ? null : ft.targetMin * 60
    const remaining = target ? target - elapsed : null
    const rMin = remaining != null ? Math.floor(Math.max(0, remaining) / 60) : mins
    const rSec = remaining != null ? (Math.max(0, remaining) % 60).toString().padStart(2, '0') : secs
    return `<div class="page-shell page-wide page-meditation focus-session">
      <button type="button" onclick="finishFreeTimerEarly()" class="btn-secondary focus-exit">← Terminar</button>
      <div class="card exercise-stage text-center">
        <p class="text-sm text-muted mb-2">${ft.open ? 'Timer libre' : `Timer ${ft.targetMin} min`}</p>
        <p id="med-timer" class="font-display text-4xl text-main mb-6">${rMin}:${rSec}</p>
        <div class="breathe-circle meditation-ring med-timer-ring"></div>
        <p class="text-xs text-muted mt-6">Coherencia respiratoria se registra al terminar</p>
        ${medState.timerHint ? `<p class="text-sm mt-3" style="color:var(--m-danger)">${medState.timerHint}</p>` : ''}
      </div>
    </div>`
  }

  const duration = MED_DURATIONS[medState.difficulty]
  const total = duration * 60
  const remaining = total - medState.elapsed
  const mins = Math.floor(remaining / 60)
  const secs = (remaining % 60).toString().padStart(2, '0')
  const phase = { inhale: 'Inhala', hold: 'Mantén', exhale: 'Exhala' }
  let content
  if (medState.session === 'breathing' || medState.session === 'box-breath') {
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
      <p id="med-step-text" class="font-display text-lg text-main">${esc(step?.text || '')}</p>`
  }
  return `<div class="page-shell page-wide page-meditation focus-session">
    <button type="button" onclick="exitMeditation()" class="btn-secondary focus-exit" aria-label="Salir de sesión">← Salir</button>
    <div class="med-active-grid">
      <div class="routine-active-side med-session-side">
        <p class="text-sm text-muted mb-4">${esc(medState.sessionName || '')}</p>
        ${medAmbientPanelHTML(true)}
      </div>
      <div class="card exercise-stage text-center">${content}</div>
    </div>
  </div>`
}

function completedHTML() {
  return `<div class="animate-fade-in text-center page-shell page-wide">
    <div class="card med-complete-card">
      <p class="med-complete-icon">${icon('calm', 'mi-icon mi-icon--xl')}</p>
      <h2 class="font-display text-2xl font-bold text-main mb-2">Sesión completada</h2>
      <p class="text-muted mb-2">${medState.completedMin} min · ${DIFFICULTIES[medState.difficulty].label}</p>
      <p class="text-sm text-muted mb-2">Racha calma: <strong>${getMeditationStreak()}</strong> días</p>
      <p class="font-bold text-main mb-6">+${DIFFICULTIES[medState.difficulty].xp} XP</p>
      <button type="button" onclick="exitMeditation()" class="btn-primary">Continuar</button>
    </div>
  </div>`
}

function hubHTML(dailyApis) {
  return `<div class="animate-fade-in page-shell page-wide page-meditation">
    <div class="ds-page ds-page--full">
    ${pageHero('Control bajo presión', 'Respiración · programas · timer libre', `${MED_DURATIONS[medState.difficulty]} min`, 'duración')}
    ${statsBar()}
    ${sunsetBannerHTML(dailyApis?.sun)}
    <div class="med-hub-actions span-full">
      <button type="button" class="btn-primary" onclick="startFreeTimer(10)">⏱ Timer 10 min</button>
      <button type="button" class="btn-secondary" onclick="startFreeTimer(0)">Timer libre</button>
      <button type="button" class="btn-secondary" onclick="navigate('/meditacion/sueno')">☾ Sueño</button>
    </div>
    <div class="page-dashboard">
      <div class="span-full">${difficultyPicker(medState.difficulty, 'setMedDiff')}</div>
      <div class="span-full">${medAmbientPanelHTML()}</div>
      <div class="span-full">${programsHTML()}</div>
      <div class="med-sessions-grid span-full">
      ${MEDITATIONS.map(s =>
        `<button type="button" onclick="startMeditation('${s.id}')" class="card med-session-card text-left w-full">
          <div class="flex items-center gap-4">
            <span class="med-session-icon">${s.icon}</span>
            <div class="flex-1">
              <h3 class="font-semibold text-main">${s.name}</h3>
              <p class="text-sm text-muted">${s.desc}</p>
              ${s.neuro ? `<p class="text-xs mt-1 med-neuro">${s.neuro}</p>` : ''}
              <p class="text-xs text-muted mt-1">${MED_DURATIONS[medState.difficulty]} min · +${DIFFICULTIES[medState.difficulty].xp} XP</p>
            </div>
          </div>
        </button>`
      ).join('')}
      </div>
    </div>
    </div>
  </div>`
}

export function renderMeditationPage(dailyApis = null) {
  if (medState.completed) return completedHTML()
  if (medState.session || medState.freeTimer?.active) return activeSessionHTML()
  if (medState.view === 'program' && medState.activeProgram) return `<div class="page-shell page-wide page-meditation"><div class="ds-page">${programViewHTML()}</div></div>`
  if (medState.view === 'sleep') return `<div class="page-shell page-wide page-meditation"><div class="ds-page">${sleepViewHTML()}</div></div>`
  return hubHTML(dailyApis)
}

export function bindMeditationGlobals() {
  window.setMedDiff = (d) => { medState.difficulty = guardDifficulty(d); window.render?.() }
  window.toggleMedVoice = (on) => { medState.voiceEnabled = !!on; window.render?.() }
  window.startMedProgram = (id) => { startMeditationProgram(id); window.navigate?.(`/meditacion/programa/${id}`) }
  window.submitSleepLog = () => {
    const h = document.getElementById('sleep-hours')?.value
    const q = document.getElementById('sleep-quality')?.value
    logSleep(h, q)
    window.render?.()
  }
  window.exitMeditation = () => {
    stopMeditationSession()
    medState.session = null
    medState.completed = false
    medState.view = 'hub'
    window.navigate?.('/meditacion')
  }
  window.finishFreeTimerEarly = () => {
    if (!finishFreeTimer()) window.render?.()
  }
  window.startMeditation = startMeditation
  window.startFreeTimer = startFreeTimer
  window.stopMeditationSession = stopMeditationSession
  window.clearMedTimers = clearMedTimers
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
    }
    window.render?.()
  }
  window.setMedAmbientVol = async function(v) {
    const vol = Math.max(0, Math.min(1, Number(v) || 0))
    const s = getSettings()
    s.medAmbientVolume = vol
    if (vol <= 0) {
      s.medAmbient = 'off'
      saveSettings(s)
      stopAmbientSound()
      window.render?.()
      return
    }
    if (!s.medAmbient || s.medAmbient === 'off') s.medAmbient = 'brown'
    saveSettings(s)
    await resumeAudioContext()
    await startAmbientSound(s.medAmbient, vol)
    window.render?.()
  }
}
