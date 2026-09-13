/** Página Calma — hub, sesiones, programas, timer libre, sueño */

import { esc, getSettings, saveSettings, DIFFICULTIES } from '../core.js'
import { isUnlocked } from '../unlocks.js'

function guardDifficulty(d) {
  return d === 'experto' && !isUnlocked('diff_expert') ? 'medio' : d
}
import { MEDITATIONS, MEDITATION_PROGRAMS, MED_CATEGORIES, getProgramCatalog, getAmbientLabel, getSessionAmbient } from '../meditations.js?v=145'
import {
  medState, MED_DURATIONS, clearMedTimers, stopMeditationSession,
  startMeditation, startFreeTimer, finishFreeTimer, startProgramSession,
  getMeditationStats, getMeditationStreak, getProgramProgress, startMeditationProgram,
  getProgramSessionForToday, isProgramCompletedToday, getProgramDayNumber, getSessionDurationMinutes,
  getProgramTimeline, getActiveProgramProgress, getProgramCatalogInfo, getProgramTodayPlan,
  hasGeminiProgramContent, prepareProgramSessionContent,
  getSleepStats, getSleepLog, logSleep, getBreathCoherenceLog,
  medAmbientVol, syncMedVoiceFromSettings, setMedVoiceEnabled, getMedVoiceLabel,
  getBreathPhaseMs, toggleMeditationPause, pauseMeditationSession, resumeMeditationSession,
} from '../meditation-service.js?v=145'
import {
  initMeditationVoice, isMeditationVoiceSupported, getSelectedVoiceURI,
  setMeditationVoiceURI, getMedVoiceRate, setMedVoiceRate, previewMeditationVoice,
  getMeditationVoiceHint, renderMeditationVoiceOptions,
  usesAzureMedVoice, usesGeminiMedVoice, usesFishMedVoice,
  listAzureVoiceOptions, listGeminiVoiceOptions,
  getStepInstructionText, getStepCueText,
  unlockMeditationAudioOnGesture,
} from '../meditation-voice.js?v=145'
import {
  listFishVoiceOptions, getFishVoiceId, getFishSpeed, setFishVoiceId, setFishSpeed,
} from '../fish-audio-tts.js?v=145'
import { getAdaptiveProgramBanner, getAdaptiveProgramSession } from '../meditation-adaptive.js'
import { AMBIENT_PRESETS, startAmbientSound, stopAmbientSound, isAmbientPlaying, getAmbientType, resumeAudioContext, preloadAmbientSounds } from '../ambient-audio.js?v=145'
import { sunsetBannerHTML } from '../apis.js'
import { icon } from '../icons.js'

function difficultyPicker(current, setter) {
  return `<div class="med-diff-block">
    <p class="med-diff-hint">Ritmo del guion y respiración — la sesión completa siempre llega al final.</p>
    <div class="med-diff-row" role="group" aria-label="Dificultad">
      ${Object.entries(DIFFICULTIES).map(([k, d]) =>
        `<button type="button" onclick="${setter}('${k}')" class="btn-secondary ${current === k ? 'is-active' : ''}" aria-pressed="${current === k}">${d.icon} ${d.label}</button>`
      ).join('')}
    </div>
  </div>`
}

function getMedRecommendation() {
  const h = new Date().getHours()
  if (h >= 5 && h < 11) return MEDITATIONS.find(m => m.id === 'morning') || MEDITATIONS[0]
  if (h >= 11 && h < 17) return MEDITATIONS.find(m => m.id === 'reset') || MEDITATIONS[0]
  if (h >= 17 && h < 22) return MEDITATIONS.find(m => m.id === 'after-work') || MEDITATIONS[0]
  return MEDITATIONS.find(m => m.id === 'presleep') || MEDITATIONS[0]
}

function progressRing(percent, size = 68) {
  const r = (size - 8) / 2
  const c = 2 * Math.PI * r
  const offset = c - (Math.min(100, percent) / 100) * c
  return `<div class="school-ring school-ring--sm" style="--ring-size:${size}px" aria-hidden="true">
    <svg viewBox="0 0 ${size} ${size}">
      <circle class="school-ring-bg" cx="${size/2}" cy="${size/2}" r="${r}" />
      <circle class="school-ring-fill" cx="${size/2}" cy="${size/2}" r="${r}"
        stroke-dasharray="${c}" stroke-dashoffset="${offset}" />
    </svg>
    <span class="school-ring-label">${Math.round(percent)}%</span>
  </div>`
}

const CALMA_CAT_COLORS = {
  breath: '#6ee7b7', body: '#93c5fd', focus: '#d4a012',
  stress: '#f9a8d4', sleep: '#a78bfa', restore: '#34d399',
}

function getSessionCategory() {
  const m = MEDITATIONS.find(x => x.id === medState.session)
  return m?.category || 'breath'
}

function calmaFxLayers(category = 'breath') {
  const accent = CALMA_CAT_COLORS[category] || CALMA_CAT_COLORS.breath
  return `<div class="calma-fx-stack" style="--calma-accent:${accent}" data-calma-cat="${category}" aria-hidden="true">
    <div class="lesson-fx-aurora calma-aurora"></div>
    <div class="calma-fx-orb-field">
      <span class="calma-fx-orb calma-fx-orb--a"></span>
      <span class="calma-fx-orb calma-fx-orb--b"></span>
      <span class="calma-fx-orb calma-fx-orb--c"></span>
    </div>
    <canvas class="calma-fx-canvas calma-fx-canvas--live"></canvas>
    <div class="calma-fx-grain"></div>
    <div class="calma-fx-vignette"></div>
  </div>`
}

function calmaTopBar(onClick, label) {
  return `<nav class="calma-top-bar" aria-label="Navegación">
    <button type="button" class="calma-exit-btn" onclick="${onClick}()">${label}</button>
  </nav>`
}

function calmaHeroHTML() {
  const st = getMeditationStats()
  const rec = getMedRecommendation()
  const dur = MED_DURATIONS[medState.difficulty]
  const xp = DIFFICULTIES[medState.difficulty].xp
  const goal = 21
  const habitPct = Math.min(100, (st.streak / goal) * 100)
  const cat = MED_CATEGORIES[rec.category] || MED_CATEGORIES.breath
  return `<header class="lesson-reader-hero calma-hero" style="--lesson-accent: var(--m-accent, #d4a012)">
    <canvas class="lesson-fx-canvas calma-fx-canvas" aria-hidden="true"></canvas>
    <div class="lesson-fx-orbs calma-fx-orbs" aria-hidden="true">
      <span class="lesson-orb lesson-orb--1 calma-orb calma-orb--1"></span>
      <span class="lesson-orb lesson-orb--2 calma-orb calma-orb--2"></span>
      <span class="lesson-orb lesson-orb--3 calma-orb calma-orb--3"></span>
    </div>
    <svg class="lesson-fx-neural" viewBox="0 0 800 400" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <path class="lesson-neural-line" d="M40,200 Q200,80 400,200 T760,200"/>
      <path class="lesson-neural-line lesson-neural-line--b" d="M0,280 Q250,120 500,260 T800,180"/>
    </svg>
    <div class="lesson-reader-hero-mesh calma-hero-mesh" aria-hidden="true"></div>
    <div class="lesson-reader-hero-glow calma-hero-glow" aria-hidden="true"></div>
    <div class="lesson-hero-fade calma-hero-fade" aria-hidden="true"></div>
    <div class="lesson-reader-hero-inner lesson-hero-stagger calma-hero-inner">
      <div class="lesson-hero-top calma-hero-top">
        <span class="school-header-kicker">Calma · FORGE</span>
        <div class="lesson-hero-stats">
          <span class="lesson-stat-pill">🔥 ${st.streak} días</span>
          <span class="lesson-stat-pill">${st.minutes} min totales</span>
          <span class="lesson-stat-pill">${dur} min · +${xp} XP</span>
        </div>
      </div>
      <div class="calma-header-metrics">
        ${progressRing(habitPct, 72)}
        <div class="school-header-stat-grid">
          <div class="school-header-stat"><span class="school-header-stat-val">${st.sessions}</span><span class="school-header-stat-label">sesiones</span></div>
          <div class="school-header-stat"><span class="school-header-stat-val">${st.streak}</span><span class="school-header-stat-label">racha</span></div>
          <div class="school-header-stat"><span class="school-header-stat-val">${dur}</span><span class="school-header-stat-label">min/sesión</span></div>
        </div>
      </div>
      <h1 class="academy-lesson-full-title lesson-hero-title calma-hero-title">Regulación nerviosa</h1>
      <p class="academy-lesson-full-hook lesson-hero-hook calma-hero-hook">Protocolos con base neuro para bajar el revoluciones — respiración, cuerpo y voz pausada.</p>
      <p class="lesson-hero-lead calma-hero-lead">Ahora mismo te conviene: <strong>${rec.name}</strong> — ${rec.hook}</p>
      <div class="calma-hero-actions">
        <button type="button" class="lesson-footer-cta calma-cta-primary" onclick="startMeditation('${rec.id}')">▶ Iniciar ${rec.name}</button>
        <button type="button" class="calma-cta-ghost" onclick="startFreeTimer(10)">Timer 10 min</button>
        <button type="button" class="calma-cta-ghost" onclick="navigate('/meditacion/sueno')">☾ Sueño</button>
      </div>
      <div class="lesson-hero-tags">
        <span class="lesson-hero-cat lesson-tag" style="--cat-color:${cat.color}">${cat.icon} ${cat.label}</span>
        <span class="lesson-tag">${MEDITATIONS.length} protocolos</span>
        <span class="lesson-tag">${MEDITATION_PROGRAMS.length} programas</span>
      </div>
    </div>
  </header>`
}

function getActiveAmbientId() {
  if (isAmbientPlaying()) {
    return getAmbientType() || medState.ambientType || getSettings().medAmbientSession || getSettings().medAmbient || 'off'
  }
  return 'off'
}

function sessionAmbientDockHTML() {
  const s = getSettings()
  const playing = isAmbientPlaying()
  const activeId = getActiveAmbientId()
  const vol = Math.round((s.medAmbientVolume ?? 0.45) * 100)
  const label = activeId !== 'off' ? getAmbientLabel(activeId) : 'Silencio'
  const dockOpen = medState.ambientDockOpen
  return `<div class="calma-ambient-dock" id="calma-ambient-dock">
    <div class="calma-ambient-dock-bar">
      <button type="button" class="calma-ambient-mute" onclick="toggleMedAmbientMute()" aria-pressed="${playing}" title="${playing ? 'Silenciar ambiente' : 'Activar ambiente'}">
        <span aria-hidden="true">${playing ? '🔊' : '🔇'}</span>
      </button>
      <span id="med-ambient-status" class="calma-ambient-status">${label}${medState.ambientAuto && playing ? ' · auto' : ''}</span>
      <input type="range" min="0" max="100" value="${playing ? vol : 0}"
        oninput="setMedAmbientVol(Number(this.value)/100)"
        class="calma-ambient-vol med-ambient-range" id="med-ambient-vol-range" aria-label="Volumen ambiente">
      <span id="med-ambient-vol-pct" class="calma-ambient-vol-pct">${playing ? `${vol}%` : '—'}</span>
      <label class="calma-ambient-voice-toggle" title="Voz guía">
        <input type="checkbox" ${medState.voiceEnabled ? 'checked' : ''} ${isMeditationVoiceSupported() ? '' : 'disabled'}
          onchange="toggleMedVoice(this.checked)" aria-label="Voz guía">
        <span>Voz</span>
      </label>
      <button type="button" class="calma-ambient-expand" onclick="toggleMedAmbientDock()" aria-expanded="${dockOpen}" title="Cambiar sonido">⋯</button>
    </div>
    <div class="calma-ambient-dock-picker ${dockOpen ? 'is-open' : ''}" id="calma-ambient-picker">
      ${AMBIENT_PRESETS.map(p => `
        <button type="button" onclick="setMedAmbient('${p.id}')" class="calma-ambient-chip ${activeId === p.id ? 'is-active' : ''}" title="${p.label}" aria-pressed="${activeId === p.id}">
          <span class="calma-ambient-chip-icon" aria-hidden="true">${p.icon}</span>
          <span class="calma-ambient-chip-label">${p.label}</span>
        </button>`).join('')}
    </div>
  </div>`
}

export function patchMedAmbientUI() {
  const dock = document.getElementById('calma-ambient-dock')
  if (!dock) return false
  const playing = isAmbientPlaying()
  const activeId = getActiveAmbientId()
  const vol = Math.round((getSettings().medAmbientVolume ?? 0.45) * 100)
  const label = activeId !== 'off' ? getAmbientLabel(activeId) : 'Silencio'

  const status = document.getElementById('med-ambient-status')
  if (status) status.textContent = `${label}${medState.ambientAuto && playing ? ' · auto' : ''}`

  const range = document.getElementById('med-ambient-vol-range')
  if (range) range.value = playing ? vol : 0

  const pct = document.getElementById('med-ambient-vol-pct')
  if (pct) pct.textContent = playing ? `${vol}%` : '—'

  const mute = dock.querySelector('.calma-ambient-mute')
  if (mute) mute.setAttribute('aria-pressed', playing)

  dock.querySelectorAll('.calma-ambient-chip').forEach(btn => {
    const match = btn.getAttribute('onclick')?.match(/setMedAmbient\('([^']+)'\)/)
    const id = match?.[1]
    btn.classList.toggle('is-active', id === activeId)
    btn.setAttribute('aria-pressed', id === activeId)
  })

  const picker = document.getElementById('calma-ambient-picker')
  if (picker) picker.classList.toggle('is-open', !!medState.ambientDockOpen)
  return true
}

function isMedSessionActive() {
  return !!(medState.session || medState.freeTimer?.active) && !medState.completed
}

function medAmbientPanelHTML() {
  const s = getSettings()
  const vol = Math.round((s.medAmbientVolume ?? 0.45) * 100)
  const playing = isAmbientPlaying()
  const activeId = playing ? (getAmbientType() || s.medAmbient) : 'off'
  const isSilent = !playing
  return `<div class="med-ambient-panel">
    <div class="med-ambient-head">
      <span class="med-ambient-title">Sonido ambiente (opcional)</span>
      ${playing ? '<span class="med-ambient-live">● Activo</span>' : '<span class="med-ambient-muted">Silencio</span>'}
    </div>
    <p class="med-ambient-note text-xs text-muted">Grabaciones reales — la voz baja el ambiente automáticamente mientras habla.</p>
    <div class="med-ambient-types">
      ${AMBIENT_PRESETS.map(p => `
        <button type="button" onclick="setMedAmbient('${p.id}')" class="med-ambient-btn ${activeId === p.id ? 'active' : ''}" title="${p.label}" aria-pressed="${activeId === p.id}">
          <span class="med-ambient-btn-label">${p.label}</span>
        </button>`).join('')}
    </div>
    <label class="med-ambient-slider ${isSilent ? 'med-ambient-slider--off' : ''}">
      <span class="text-xs text-muted">Volumen</span>
      <input type="range" min="0" max="100" value="${isSilent ? 0 : vol}" ${isSilent ? 'disabled' : ''}
        oninput="setMedAmbientVol(Number(this.value)/100)" class="med-ambient-range" aria-label="Volumen ambiente">
      <span id="med-ambient-vol-pct" class="text-xs text-muted">${isSilent ? '—' : `${vol}%`}</span>
    </label>
    <label class="med-voice-toggle ${isMeditationVoiceSupported() ? '' : 'med-voice-toggle--off'}">
      <input type="checkbox" ${medState.voiceEnabled ? 'checked' : ''} ${isMeditationVoiceSupported() ? '' : 'disabled'}
        onchange="toggleMedVoice(this.checked)" aria-label="Voz guía natural">
      <span>Voz guía natural</span>
      <span class="med-voice-name">${getMedVoiceLabel()}</span>
    </label>
    <p class="med-voice-hint text-xs text-muted">${esc(getMeditationVoiceHint())}</p>
    ${isMeditationVoiceSupported() && medState.voiceEnabled ? `${usesFishMedVoice() ? `<label class="med-voice-picker">
      <span class="text-xs text-muted">Voz Fish Audio</span>
      <select class="input-field text-sm" onchange="setFishVoice(this.value)" aria-label="Voz Fish Audio">
        ${listFishVoiceOptions(getFishVoiceId())}
      </select>
    </label>` : usesAzureMedVoice() ? `<label class="med-voice-picker">
      <span class="text-xs text-muted">Voz Microsoft</span>
      <select class="input-field text-sm" onchange="setAzureVoice(this.value)" aria-label="Voz Microsoft">
        ${listAzureVoiceOptions()}
      </select>
    </label>` : usesGeminiMedVoice() ? `<label class="med-voice-picker">
      <span class="text-xs text-muted">Voz Gemini</span>
      <select class="input-field text-sm" onchange="setGeminiVoice(this.value)" aria-label="Voz Gemini">
        ${listGeminiVoiceOptions()}
      </select>
    </label>` : `<label class="med-voice-picker">
      <span class="text-xs text-muted">Narrador (Google / sistema)</span>
      <select class="input-field text-sm" onchange="setMedVoiceURI(this.value)" aria-label="Elegir voz">
        ${renderMeditationVoiceOptions(getSelectedVoiceURI())}
      </select>
    </label>`}
    <label class="med-voice-rate">
      <span class="text-xs text-muted">Velocidad de voz</span>
      <div class="med-voice-rate-row">
        <input type="range" min="${usesFishMedVoice() ? 85 : 42}" max="${usesFishMedVoice() ? 115 : 72}" value="${usesFishMedVoice() ? Math.round(getFishSpeed() * 100) : Math.round(getMedVoiceRate() * 100)}"
          oninput="${usesFishMedVoice() ? `setFishSpeed(Number(this.value)/100); document.getElementById('med-voice-rate-pct')?.textContent=Math.round(Number(this.value))+'%'` : `setMedVoiceRate(Number(this.value)/100); document.getElementById('med-voice-rate-pct')?.textContent=Math.round(Number(this.value))+'%'`}"
          class="med-ambient-range" aria-label="Velocidad de voz">
        <span id="med-voice-rate-pct" class="text-xs text-muted">${usesFishMedVoice() ? Math.round(getFishSpeed() * 100) : Math.round(getMedVoiceRate() * 100)}%</span>
        <button type="button" class="btn-secondary text-xs" onclick="previewMedVoice()">Probar</button>
      </div>
      <span class="text-xs text-muted">${usesFishMedVoice() ? 'Fish Audio · voces naturales y biblioteca.' : usesAzureMedVoice() ? 'Microsoft Neural · 500k chars/mes gratis.' : usesGeminiMedVoice() ? 'Motor Gemini · experimental.' : 'Mejor en Chrome con voces Google.'}</span>
    </label>` : ''}
  </div>`
}

function sessionControlsHTML() {
  const paused = medState.paused
  return `<div class="med-session-controls">
    <button type="button" class="med-pause-btn ${paused ? 'is-paused' : ''}" onclick="toggleMedPause()" aria-pressed="${paused}">
      <span class="med-pause-icon" aria-hidden="true">${paused ? '▶' : '⏸'}</span>
      <span>${paused ? 'Continuar' : 'Pausa'}</span>
    </button>
    ${paused ? '<p class="med-paused-label">Sesión en pausa</p>' : ''}
  </div>`
}

function featuredCardHTML() {
  const rec = getMedRecommendation()
  const recDur = getSessionDurationMinutes(rec.id)
  const active = getActiveProgramProgress()
  const prog = active?.active && !active.done
    ? MEDITATION_PROGRAMS.find(p => p.id === active.active)
    : MEDITATION_PROGRAMS.find(p => {
      const pr = getProgramProgress(p.id)
      return pr.started && !pr.done
    })
  if (prog) {
    const pr = getProgramProgress(prog.id)
    const dayNum = getProgramDayNumber(prog.id)
    const adaptive = getAdaptiveProgramSession(prog.id)
    const today = adaptive.session
    const dayPlan = getProgramTodayPlan(prog.id)
    const doneToday = isProgramCompletedToday(prog.id)
    const todayDur = today ? getSessionDurationMinutes(today.id) : 0
    const catalog = getProgramCatalog(prog.id)
    return `<article class="calma-featured-card calma-glass-panel ${doneToday ? 'calma-featured-card--done' : ''}">
      <p class="calma-featured-label">Programa activo · ${catalog?.focus || 'Calma'}</p>
      <h2 class="calma-featured-title">${prog.name}</h2>
      <p class="calma-featured-sub">${doneToday ? `Día ${dayNum} completado hoy ✓` : `Día ${dayNum} de ${prog.days}`} · ${pr.percent}% · ${dayPlan?.phase || ''}</p>
      <div class="calma-featured-bar"><div class="calma-featured-bar-fill" style="width:${pr.percent}%"></div></div>
      ${doneToday ? `<p class="calma-featured-sub">Progreso guardado. Mañana: día ${Math.min(dayNum + 1, prog.days)}.</p>
        <button type="button" class="calma-featured-cta" onclick="navigate('/meditacion/programa/${prog.id}')">Ver tu camino →</button>`
        : today ? `<p class="calma-featured-day-title">${dayPlan?.title || today.name}</p>
        <p class="calma-featured-day-intent">${dayPlan?.intention || today.desc}</p>
        <button type="button" class="calma-featured-cta" onclick="startProgramSession('${prog.id}', '${today.id}')">${today.icon} Iniciar día ${dayNum} · ~${todayDur} min</button>`
        : `<button type="button" class="calma-featured-cta" onclick="navigate('/meditacion/programa/${prog.id}')">Ver programa</button>`}
    </article>`
  }
  const cat = MED_CATEGORIES[rec.category] || MED_CATEGORIES.breath
  return `<article class="school-focus calma-focus">
    <p class="school-focus-kicker">Recomendado ahora</p>
    <h2 class="school-focus-title">${rec.icon} ${rec.name}</h2>
    <p class="school-focus-desc">${rec.hook}</p>
    <button type="button" class="school-focus-cta calma-featured-cta" onclick="startMeditation('${rec.id}')">Iniciar · ${recDur} min →</button>
    <span class="lesson-hero-cat lesson-tag calma-focus-tag" style="--cat-color:${cat.color}">${cat.icon} ${cat.label}</span>
  </article>`
}

function sessionCardHTML(s) {
  const dur = getSessionDurationMinutes(s.id)
  const xp = DIFFICULTIES[medState.difficulty].xp
  const cat = MED_CATEGORIES[s.category] || MED_CATEGORIES.breath
  return `<button type="button" class="academy-lesson-card calma-protocol-card" onclick="startMeditation('${s.id}')">
    <div class="academy-lesson-card__head">
      <span class="academy-lesson-cat lesson-hero-cat" style="--cat-color:${cat.color}">${cat.icon} ${cat.label}</span>
      <span class="academy-lesson-time">~${dur} min · +${xp} XP</span>
    </div>
    <h3 class="academy-lesson-title">${s.icon} ${s.name}</h3>
    <p class="academy-lesson-hook">${s.hook || s.desc}</p>
    ${s.neuro ? `<p class="calma-neuro-chip">${s.neuro}</p>` : ''}
    <span class="calma-session-ambient-tag">🎧 ${getAmbientLabelForSession(s.id)}</span>
  </button>`
}

function getAmbientLabelForSession(id) {
  return getAmbientLabel(getSessionAmbient(id))
}

function programsHTML() {
  const activeId = getActiveProgramProgress()?.active
  return `<section class="calma-section calma-section--programs">
    <div class="school-zone-head">
      <div>
        <h2 class="school-zone-title">Programas guiados</h2>
        <p class="school-zone-desc">Caminos con propósito: cada día tiene intención, herramienta y fase. Una sesión al día desde el programa.</p>
      </div>
    </div>
    <div class="calma-program-catalog">
      ${MEDITATION_PROGRAMS.map(p => {
        const prog = getProgramProgress(p.id)
        const cat = getProgramCatalog(p.id)
        const isActive = activeId === p.id && prog.started && !prog.done
        const status = prog.done ? 'Completado ✓' : prog.doneToday ? 'Hoy listo ✓' : prog.started ? `Día ${prog.currentDay}/${p.days}` : 'Sin empezar'
        const today = isActive && !prog.doneToday ? getProgramSessionForToday(p.id) : null
        return `<article class="calma-program-catalog-card ${isActive ? 'is-active' : ''} ${prog.done ? 'is-finished' : ''}">
          <div class="calma-program-catalog-head">
            <span class="calma-program-catalog-icon">${cat?.icon || '🧘'}</span>
            <div>
              <span class="calma-program-catalog-level" style="--level-color:${cat?.levelColor || '#6ee7b7'}">${cat?.level || 'Programa'}</span>
              <h3 class="calma-program-catalog-name">${p.name}</h3>
              <p class="calma-program-catalog-tagline">${cat?.tagline || p.desc}</p>
            </div>
          </div>
          <p class="calma-program-catalog-purpose">${cat?.purpose || p.desc}</p>
          <p class="calma-program-catalog-outcome">${cat?.outcome || ''}</p>
          <p class="calma-program-catalog-audience">${cat?.audience || ''}</p>
          <div class="calma-program-catalog-phases">
            ${(cat?.phases || []).map(ph => `<span class="calma-program-phase-chip"><strong>${ph.label}</strong> ${ph.title}</span>`).join('')}
          </div>
          <div class="calma-program-catalog-meta">
            <span>${p.days} días</span>
            <span>~${cat?.minutesPerDay || '3–10'} min</span>
            <span>🎧 ${getAmbientLabel(cat?.ambient || 'forest')}</span>
            <span>${cat?.focus || 'Calma'}</span>
          </div>
          <div class="calma-program-progress"><span style="width:${prog.percent}%"></span></div>
          <div class="calma-program-catalog-foot">
            <span class="calma-program-meta">${prog.completed}/${p.days} · ${status}</span>
            ${today ? `<span class="calma-program-today-chip">Hoy: ${getProgramTodayPlan(p.id)?.title || today.name}</span>` : ''}
            <button type="button" class="calma-program-catalog-cta" onclick="startMedProgram('${p.id}')">${prog.done ? 'Ver camino' : isActive && today && !prog.doneToday ? 'Continuar hoy' : prog.started ? 'Abrir programa' : 'Empezar programa'}</button>
          </div>
        </article>`
      }).join('')}
    </div>
  </section>`
}

function programTimelineHTML(programId) {
  const timeline = getProgramTimeline(programId)
  if (!timeline.length) return ''
  return `<ol class="calma-program-timeline" aria-label="Camino del programa">
    ${timeline.map(item => {
      const cls = item.done ? 'is-done' : item.isToday ? 'is-today' : 'is-upcoming'
      const meta = item.session
      const adapted = item.record?.scheduledSessionId && item.record.scheduledSessionId !== item.record.sessionId
      return `<li class="calma-program-day ${cls}">
        <span class="calma-program-day-dot" aria-hidden="true">${item.done ? '✓' : item.day}</span>
        <div class="calma-program-day-body">
          <span class="calma-program-day-label">Día ${item.day}${item.phase ? ` · ${item.phase}` : ''}</span>
          <span class="calma-program-day-title">${item.title}</span>
          <span class="calma-program-day-session">${meta?.icon || ''} ${meta?.name || item.sessionId}${item.skill ? ` · ${item.skill}` : ''}</span>
          <span class="calma-program-day-intent">${item.intention}</span>
          ${item.record ? `<span class="calma-program-day-meta">${item.record.minutes || '~'} min · ${item.record.date}${adapted ? ' · sesión adaptativa' : ''}</span>`
            : item.isToday ? `<span class="calma-program-day-meta">Hoy · ~${getSessionDurationMinutes(item.sessionId)} min · 🎧 ${getAmbientLabel(item.ambient)}</span>`
            : `<span class="calma-program-day-meta">~${getSessionDurationMinutes(item.sessionId)} min · 🎧 ${getAmbientLabel(item.ambient)}</span>`}
        </div>
      </li>`
    }).join('')}
  </ol>`
}

function programViewHTML() {
  const id = medState.activeProgram
  const prog = getProgramProgress(id)
  if (!prog) return ''
  const catalog = getProgramCatalogInfo(id)
  const dayNum = getProgramDayNumber(id)
  const doneToday = isProgramCompletedToday(id)
  const adaptive = getAdaptiveProgramSession(id)
  const todaySession = adaptive.session
  const dayPlan = getProgramTodayPlan(id)
  const todayDur = todaySession ? getSessionDurationMinutes(todaySession.id) : 0
  const todayAmb = todaySession ? getAmbientLabel(getSessionAmbient(todaySession.id)) : ''
  const diffHint = adaptive.suggestedDifficulty ? `setMedDiff('${adaptive.suggestedDifficulty}');` : ''
  const nextDayPlan = !prog.done && dayNum < prog.program.days ? getProgramTimeline(id).find(t => t.day === dayNum + 1) : null
  return `<div class="calma-glass-panel med-program-active">
    <div class="calma-program-hero">
      <span class="calma-program-hero-icon">${catalog?.icon || '🧘'}</span>
      <div>
        <span class="calma-program-catalog-level" style="--level-color:${catalog?.levelColor || '#6ee7b7'}">${catalog?.level || 'Programa'}</span>
        <h2 class="font-display text-xl font-bold text-main">${prog.program.name}</h2>
        <p class="text-sm text-muted">${catalog?.tagline || prog.program.desc}</p>
      </div>
    </div>
    <p class="calma-program-catalog-purpose">${catalog?.purpose || prog.program.purpose || ''}</p>
    <p class="calma-program-catalog-outcome">${catalog?.outcome || ''}</p>
    <p class="calma-program-catalog-audience">${catalog?.audience || ''}</p>
    <div class="calma-program-catalog-phases calma-program-catalog-phases--detail">
      ${(catalog?.phases || []).map(ph => `<div class="calma-program-phase-block"><span class="calma-program-phase-chip"><strong>${ph.label}</strong> ${ph.title}</span><p>${ph.desc}</p></div>`).join('')}
    </div>
    <p class="text-sm text-main mb-4"><strong>${prog.completed}</strong> de ${prog.program.days} días · ${prog.percent}% completado</p>
    <div class="progress-track w-full mb-4"><div class="progress-fill h-full" style="width:${prog.percent}%"></div></div>
    ${getAdaptiveProgramBanner(id)}
    ${doneToday && !prog.done ? `<div class="calma-program-today calma-program-today--done">
      <p class="calma-program-today-title">Día ${dayNum} completado hoy ✓</p>
      <p class="calma-program-today-sub">${dayPlan?.title ? `«${dayPlan.title}» guardado.` : 'Progreso guardado.'} Mañana: ${nextDayPlan?.title || `día ${Math.min(dayNum + 1, prog.program.days)}`}.</p>
    </div>`
      : todaySession ? `<div class="calma-program-today">
      <p class="calma-program-today-kicker">${dayPlan?.phase || 'Hoy'} · Día ${dayNum} de ${prog.program.days}</p>
      <p class="calma-program-today-title">${dayPlan?.title || todaySession.name}</p>
      <p class="calma-program-today-intent">${dayPlan?.intention || todaySession.desc}</p>
      <p class="calma-program-today-session">${todaySession.icon} ${todaySession.name} · ~${todayDur} min · 🎧 ${todayAmb}${dayPlan?.skill ? ` · ${dayPlan.skill}` : ''}${adaptive.mode !== 'normal' ? ' <span class="med-adaptive-tag">adaptativo</span>' : ''}</p>
      <button type="button" class="btn-primary w-full mt-3" onclick="${diffHint}startProgramSession('${id}', '${todaySession.id}')">Iniciar día ${dayNum}</button>
      ${hasGeminiProgramContent() ? '<p class="calma-gemini-note">✦ Gemini activo: guion adaptado a este día (la voz sigue siendo Azure o navegador).</p>' : ''}
      <p class="calma-program-today-note">La voz abre con el contexto del programa. Solo cuenta si inicias desde aquí.</p>
    </div>`
      : prog.done ? `<p class="text-sm text-muted">Programa completado. Elige otro camino o repite este.</p>`
      : `<p class="text-sm text-muted">Sin sesión pendiente hoy.</p>`}
    <div class="calma-program-timeline-wrap">
      <h3 class="calma-program-timeline-title">Tu camino</h3>
      ${programTimelineHTML(id)}
    </div>
  </div>`
}

function sleepViewHTML() {
  const stats = getSleepStats()
  const log = getSleepLog()
  const today = Object.keys(log).slice(-7).reverse()
  return `<div class="calma-glass-panel med-sleep-panel is-revealed">
    <h2 class="font-display text-xl font-bold text-main">Registro de sueño</h2>
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

function sessionChromeHTML(exitFn, exitLabel = 'Calma') {
  const total = (medState.freeTimer?.active
    ? (medState.freeTimer.open ? Math.max(medState.freeTimer.elapsed, 1) : medState.freeTimer.targetMin * 60)
    : medState.totalSec || MED_DURATIONS[medState.difficulty] * 60) || 1
  const elapsed = medState.freeTimer?.active ? medState.freeTimer.elapsed : medState.elapsed
  const pct = Math.min(100, (elapsed / total) * 100)
  return `<div class="lesson-reader-progress-top" aria-hidden="true"><div class="lesson-reader-progress-top-fill calma-progress-top" style="width:${pct}%"></div></div>
  <header class="lesson-reader-chrome calma-session-chrome">
    <button type="button" onclick="${exitFn}()" class="lesson-reader-back calma-exit-btn">← ${exitLabel}</button>
    <span class="lesson-reader-chrome-title calma-chrome-title">${esc(medState.sessionName || 'Sesión')}</span>
    <div class="lesson-reader-progress" aria-hidden="true"><div class="lesson-reader-progress-fill calma-chrome-progress-fill" style="width:${pct}%"></div></div>
    <button type="button" class="calma-chrome-ambient" onclick="toggleMedAmbientDock(true)" title="Sonido ambiente" aria-pressed="${medState.ambientDockOpen}">🎧</button>
    <button type="button" class="calma-chrome-pause" onclick="toggleMedPause()" aria-pressed="${medState.paused}">${medState.paused ? '▶' : '⏸'}</button>
  </header>`
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
    return `<div class="calma-viewport calma-viewport--session" data-calma-cat="breath">
      ${calmaFxLayers('breath')}
      ${sessionChromeHTML('finishFreeTimerEarly', 'Terminar')}
      <div class="calma-session-stage ${medState.paused ? 'is-paused' : ''}">
        <p class="calma-session-kicker">${ft.open ? 'Timer libre' : `Timer ${ft.targetMin} min`}</p>
        <p id="med-timer" class="calma-session-timer">${rMin}:${rSec}</p>
        <div class="calma-breathe-ring med-timer-ring breathe-circle meditation-ring"></div>
        ${sessionControlsHTML()}
        <p class="calma-session-hint">Coherencia respiratoria al terminar · mínimo 45 s</p>
        ${medState.timerHint ? `<p class="calma-session-error">${medState.timerHint}</p>` : ''}
      </div>
      ${sessionAmbientDockHTML()}
    </div>`
  }

  const total = medState.totalSec || MED_DURATIONS[medState.difficulty] * 60
  const remaining = total - medState.elapsed
  const mins = Math.floor(remaining / 60)
  const secs = (remaining % 60).toString().padStart(2, '0')
  const phase = { inhale: 'Inhala', hold: 'Mantén', exhale: 'Exhala' }
  let stageInner
  const breathSec = (getBreathPhaseMs() / 1000).toFixed(1)
  const progCtx = medState.programContext?.programId
  const breathProgKicker = progCtx ? (() => {
    const pr = getProgramProgress(progCtx)
    const plan = getProgramTodayPlan(progCtx)
    if (!pr) return ''
    return `<div class="calma-session-program">
      <p class="calma-session-kicker">${pr.program.name} · Día ${getProgramDayNumber(progCtx)} de ${pr.program.days}${plan?.phase ? ` · ${plan.phase}` : ''}</p>
      ${plan?.title ? `<p class="calma-session-day-title">${plan.title}</p>` : ''}
      ${plan?.intention ? `<p class="calma-session-day-intent">${plan.intention}</p>` : ''}
    </div>`
  })() : ''
  if (medState.session === 'breathing' || medState.session === 'box-breath') {
    const scale = medState.phase === 'inhale' ? 1.22 : medState.phase === 'exhale' ? 0.78 : 1.08
    stageInner = `
      ${breathProgKicker}
      <p id="med-timer" class="calma-session-timer-sm">${mins}:${secs}</p>
      <div class="calma-breathe-wrap">
        <div id="med-breathe-circle" class="calma-breathe-ring breathe-circle meditation-ring" style="transform:scale(${scale});transition:transform ${breathSec}s ease-in-out"></div>
        <span id="med-phase-text" class="calma-phase-label">${phase[medState.phase]}</span>
      </div>
      <p class="calma-session-hint">${breathSec}s por fase · sigue el círculo y la voz</p>
      ${sessionControlsHTML()}`
  } else {
    const steps = medState.steps || []
    const step = steps[medState.step]
    const stepPct = step?.duration ? Math.min(100, (medState.stepElapsed / step.duration) * 100) : 0
    const progCtx = medState.programContext?.programId
    const progKicker = progCtx ? (() => {
      const pr = getProgramProgress(progCtx)
      const plan = getProgramTodayPlan(progCtx)
      if (!pr) return ''
      return `<div class="calma-session-program">
        <p class="calma-session-kicker">${pr.program.name} · Día ${getProgramDayNumber(progCtx)} de ${pr.program.days}${plan?.phase ? ` · ${plan.phase}` : ''}</p>
        ${plan?.title ? `<p class="calma-session-day-title">${plan.title}</p>` : ''}
        ${plan?.intention ? `<p class="calma-session-day-intent">${plan.intention}</p>` : ''}
      </div>`
    })() : ''
    const stepCue = getStepCueText(step)
    const stepInstruction = getStepInstructionText(step)
    stageInner = `
      ${progKicker}
      <p id="med-timer" class="calma-session-timer-sm">${mins}:${secs} restantes · Paso ${medState.step + 1}/${steps.length}</p>
      <article class="lesson-section-card calma-step-card is-active is-revealed">
        <span class="lesson-section-watermark" aria-hidden="true">${String(medState.step + 1).padStart(2, '0')}</span>
        <div class="lesson-section-inner">
          <p class="lesson-block-label">Instrucción</p>
          ${stepCue ? `<p class="calma-step-cue">${esc(stepCue)}</p>` : ''}
          <p id="med-step-text" class="calma-step-text calma-step-instruction lesson-hero-hook">${esc(stepInstruction)}</p>
        </div>
      </article>
      <div class="calma-step-progress" title="Progreso de la sesión"><div id="med-progress-fill" class="lesson-reader-progress-fill calma-step-progress-fill" style="width:${(medState.elapsed/total)*100}%"></div></div>
      <div class="calma-step-subprogress" aria-hidden="true"><div class="calma-step-subprogress-fill" style="width:${stepPct}%"></div></div>
      ${sessionControlsHTML()}`
  }
  const cat = getSessionCategory()
  return `<div class="calma-viewport calma-viewport--session" data-calma-cat="${cat}">
    ${calmaFxLayers(cat)}
    ${sessionChromeHTML('exitMeditation')}
    <div class="calma-session-stage ${medState.paused ? 'is-paused' : ''}">${stageInner}</div>
    ${sessionAmbientDockHTML()}
  </div>`
}

function completedHTML() {
  const lc = medState.lastCompletion
  const prog = lc?.programAdvance
  const sessionMeta = lc?.sessionId ? MEDITATIONS.find(m => m.id === lc.sessionId) : null
  const cat = getSessionCategory()
  return `<div class="calma-viewport calma-viewport--complete" data-calma-cat="${cat}">
    ${calmaFxLayers(cat)}
    <div class="calma-complete-card">
      <div class="calma-complete-glow" aria-hidden="true"></div>
      <p class="med-complete-icon">${icon('calm', 'mi-icon mi-icon--xl')}</p>
      <h2 class="calma-complete-title">${prog ? (prog.dayTitle ? `«${prog.dayTitle}» completado` : `Día ${prog.day} completado`) : 'Sesión completada'}</h2>
      <p class="calma-complete-sub">${sessionMeta ? `${sessionMeta.icon} ${sessionMeta.name} · ` : ''}${medState.completedMin} min · ${DIFFICULTIES[medState.difficulty].label}</p>
      ${prog ? `<div class="calma-complete-program">
        <p class="calma-complete-program-kicker">${prog.programName}</p>
        <div class="calma-featured-bar"><div class="calma-featured-bar-fill" style="width:${prog.percent}%"></div></div>
        <p class="calma-complete-program-meta">${prog.day}/${prog.totalDays} días · ${prog.percent}%</p>
        ${prog.done ? '<p class="calma-complete-program-done">Programa terminado. Tienes herramientas reales ahora.</p>'
          : prog.nextDayTitle ? `<p class="calma-complete-program-next">Mañana: «${prog.nextDayTitle}»${prog.nextSession ? ` · ${prog.nextSession.icon} ${prog.nextSession.name}` : ''}</p>`
          : prog.nextSession ? `<p class="calma-complete-program-next">Mañana: ${prog.nextSession.icon} ${prog.nextSession.name}</p>` : ''}
      </div>` : ''}
      <div class="calma-complete-stats">
        <span class="calma-pill">🔥 Racha ${getMeditationStreak()} días</span>
        <span class="calma-pill calma-pill--xp">+${DIFFICULTIES[medState.difficulty].xp} XP</span>
      </div>
      <button type="button" onclick="exitMeditation()" class="calma-cta-primary">${prog ? 'Ver programa' : 'Continuar'}</button>
    </div>
  </div>`
}

function geminiPreparingOverlay() {
  if (!medState.geminiPreparing) return ''
  return `<div class="calma-gemini-preparing" role="status" aria-live="polite">
    <div class="calma-gemini-preparing-card">
      <span class="calma-gemini-preparing-icon">✦</span>
      <p class="calma-gemini-preparing-title">Gemini está preparando tu sesión</p>
      <p class="calma-gemini-preparing-sub">Gemini está reescribiendo el guion para hoy…</p>
    </div>
  </div>`
}

function hubHTML(dailyApis) {
  const quick = ['breathing', 'reset', 'prefocus', 'presleep'].map(id => MEDITATIONS.find(m => m.id === id)).filter(Boolean)
  const recCat = getMedRecommendation().category || 'breath'
  return `<div class="calma-viewport lesson-reader-viewport page-meditation" data-calma-cat="${recCat}">
    ${geminiPreparingOverlay()}
    ${calmaFxLayers(recCat)}
    ${calmaTopBar('leaveCalma', '← Inicio')}
    ${calmaHeroHTML()}
    <div class="calma-body lesson-reader-body">
      ${sunsetBannerHTML(dailyApis?.sun) ? `<div class="calma-sunset">${sunsetBannerHTML(dailyApis?.sun)}</div>` : ''}
      <div class="calma-body-grid school-layout">
        <main class="calma-main school-main">
          <div class="calma-quick-row">
            ${quick.map(s => `<button type="button" class="calma-quick-btn lesson-tag" onclick="startMeditation('${s.id}')">${s.icon} ${s.name}</button>`).join('')}
          </div>
          ${featuredCardHTML()}
          ${programsHTML()}
          <section class="calma-section">
            <div class="school-zone-head">
              <div><h2 class="school-zone-title">Biblioteca de protocolos</h2><p class="school-zone-desc">${MEDITATIONS.length} sesiones con guion hablado lento y base neuro.</p></div>
            </div>
            <div class="academy-lesson-grid calma-sessions-grid">
              ${MEDITATIONS.map(sessionCardHTML).join('')}
            </div>
          </section>
        </main>
        <aside class="calma-rail school-aside lesson-rail-glass">
          <div class="school-panel calma-glass-panel">
            <h3 class="school-zone-title">Sesión</h3>
            <p class="school-zone-desc">Duración y recompensa</p>
            ${difficultyPicker(medState.difficulty, 'setMedDiff')}
          </div>
          <div class="school-panel calma-glass-panel">${medAmbientPanelHTML()}</div>
        </aside>
      </div>
    </div>
  </div>`
}

let lastProgramPrefetchKey = null

function prefetchProgramDayIfNeeded(programId) {
  const session = getProgramSessionForToday(programId)
  if (!session || !hasGeminiProgramContent()) return
  const key = `${programId}:${getProgramDayNumber(programId)}:${session.id}`
  if (lastProgramPrefetchKey === key) return
  lastProgramPrefetchKey = key
  prepareProgramSessionContent(programId, session.id).catch(() => {})
}

export function renderMeditationPage(dailyApis = null) {
  syncMedVoiceFromSettings()
  if (medState.completed) return completedHTML()
  if (medState.session || medState.freeTimer?.active) return activeSessionHTML()
  if (medState.view === 'program' && medState.activeProgram) {
    prefetchProgramDayIfNeeded(medState.activeProgram)
    return `<div class="calma-viewport page-meditation calma-viewport--program" data-calma-cat="restore">${geminiPreparingOverlay()}${calmaFxLayers('restore')}${calmaTopBar('goCalmaHub', '← Calma')}<div class="calma-body calma-body--narrow">${programViewHTML()}</div></div>`
  }
  if (medState.view === 'sleep') {
    return `<div class="calma-viewport page-meditation" data-calma-cat="sleep">${calmaFxLayers('sleep')}${calmaTopBar('goCalmaHub', '← Calma')}<div class="calma-body calma-body--narrow">${sleepViewHTML()}</div></div>`
  }
  return hubHTML(dailyApis)
}

export function bindMeditationGlobals() {
  initMeditationVoice()
  syncMedVoiceFromSettings()
  preloadAmbientSounds()
  window.setMedDiff = (d) => { medState.difficulty = guardDifficulty(d); window.render?.() }
  window.toggleMedVoice = (on) => {
    setMedVoiceEnabled(on)
    if (isMedSessionActive()) patchMedAmbientUI()
    else window.render?.()
  }
  window.setMedVoiceURI = (uri) => { setMeditationVoiceURI(uri); window.render?.() }
  window.setMedVoiceRate = setMedVoiceRate
  window.previewMedVoice = async () => {
    unlockMeditationAudioOnGesture()
    return previewMeditationVoice()
  }
  window.setFishVoice = (id) => {
    setFishVoiceId(id)
    const s = getSettings()
    if (s.medVoiceEngine !== 'fish') {
      s.medVoiceEngine = 'fish'
      saveSettings(s)
    }
    window.render?.()
  }
  window.setAzureVoice = async (id) => {
    const { setAzureVoiceId } = await import('../azure-tts.js?v=145')
    setAzureVoiceId(id)
    window.render?.()
  }
  window.setGeminiVoice = async (id) => {
    const { setGeminiVoiceId } = await import('../gemini-tts.js?v=145')
    setGeminiVoiceId(id)
    window.render?.()
  }
  window.toggleMedPause = toggleMeditationPause
  window.pauseMeditationSession = pauseMeditationSession
  window.resumeMeditationSession = resumeMeditationSession
  window.startMedProgram = (id) => {
    unlockMeditationAudioOnGesture()
    startMeditationProgram(id)
    window.navigate?.(`/meditacion/programa/${id}`)
  }
  window.submitSleepLog = () => {
    const h = document.getElementById('sleep-hours')?.value
    const q = document.getElementById('sleep-quality')?.value
    logSleep(h, q)
    window.render?.()
  }
  window.goCalmaHub = () => {
    stopMeditationSession()
    medState.session = null
    medState.completed = false
    medState.view = 'hub'
    window.navigate?.('/meditacion')
  }
  window.leaveCalma = () => {
    stopMeditationSession()
    medState.session = null
    medState.completed = false
    medState.view = 'hub'
    window.navigate?.('/')
  }
  window.exitMeditation = () => {
    const progId = medState.lastCompletion?.programAdvance?.programId
    if (progId) {
      medState.view = 'program'
      medState.activeProgram = progId
      medState.session = null
      medState.completed = false
      medState.lastCompletion = null
      window.navigate?.(`/meditacion/programa/${progId}`)
      return
    }
    window.goCalmaHub()
  }
  window.finishFreeTimerEarly = () => {
    if (!finishFreeTimer()) window.render?.()
  }
  window.startMeditation = async (id, opts) => {
    unlockMeditationAudioOnGesture()
    return startMeditation(id, opts)
  }
  window.startProgramSession = async (programId, sessionId) => {
    unlockMeditationAudioOnGesture()
    if (hasGeminiProgramContent()) {
      medState.geminiPreparing = true
      window.render?.()
    }
    try {
      await startProgramSession(programId, sessionId)
    } finally {
      medState.geminiPreparing = false
    }
  }
  window.startFreeTimer = async (minutes) => {
    unlockMeditationAudioOnGesture()
    return startFreeTimer(minutes)
  }
  window.stopMeditationSession = stopMeditationSession
  window.clearMedTimers = clearMedTimers
  window.setMedAmbient = async function(type) {
    const s = getSettings()
    await resumeAudioContext()
    medState.ambientAuto = false
    if (type === 'off') {
      s.medAmbient = 'off'
      delete s.medAmbientSession
      saveSettings(s)
      stopAmbientSound()
      medState.ambientPreview = false
      medState.ambientType = null
    } else {
      s.medAmbient = type
      delete s.medAmbientSession
      const vol = medAmbientVol(s) || 0.32
      s.medAmbientVolume = vol
      saveSettings(s)
      const ok = await startAmbientSound(type, vol)
      medState.ambientPreview = ok
      medState.ambientType = ok ? type : null
      medState.ambientMuted = type
    }
    if (isMedSessionActive()) patchMedAmbientUI()
    else window.render?.()
  }
  window.setMedAmbientVol = async function(v) {
    const vol = Math.max(0, Math.min(1, Number(v) || 0))
    const s = getSettings()
    s.medAmbientVolume = vol
    if (vol <= 0) {
      medState.ambientMuted = getActiveAmbientId() !== 'off' ? getActiveAmbientId() : medState.ambientMuted
      s.medAmbient = 'off'
      delete s.medAmbientSession
      saveSettings(s)
      stopAmbientSound()
      medState.ambientType = null
      medState.ambientPreview = false
      if (isMedSessionActive()) patchMedAmbientUI()
      else window.render?.()
      return
    }
    let type = s.medAmbient
    if (!type || type === 'off' || type === 'auto') {
      type = medState.ambientMuted || medState.ambientType || getSessionAmbient(medState.session) || 'forest'
      s.medAmbient = type
      medState.ambientAuto = false
    }
    saveSettings(s)
    await resumeAudioContext()
    const ok = await startAmbientSound(type, vol)
    medState.ambientPreview = ok
    medState.ambientType = ok ? type : null
    if (isMedSessionActive()) patchMedAmbientUI()
    else window.render?.()
  }
  window.toggleMedAmbientMute = async function() {
    if (isAmbientPlaying()) {
      medState.ambientMuted = getActiveAmbientId()
      await window.setMedAmbient('off')
    } else {
      const type = medState.ambientMuted || medState.ambientType || getSessionAmbient(medState.session) || 'forest'
      await window.setMedAmbient(type)
    }
  }
  window.toggleMedAmbientDock = function(forceOpen) {
    medState.ambientDockOpen = forceOpen === true ? true : !medState.ambientDockOpen
    const picker = document.getElementById('calma-ambient-picker')
    if (picker) picker.classList.toggle('is-open', medState.ambientDockOpen)
    document.querySelector('.calma-chrome-ambient')?.setAttribute('aria-pressed', medState.ambientDockOpen)
    document.querySelector('.calma-ambient-expand')?.setAttribute('aria-expanded', medState.ambientDockOpen)
  }
  window.patchMedAmbientUI = patchMedAmbientUI
}
