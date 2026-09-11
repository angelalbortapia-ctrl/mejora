/** Onboarding inmersivo — estado y overlay */

import {
  esc, getSettings, getHabits, setItem, needsOnboarding, GOAL_TEMPLATES,
} from './core.js'

export const onboarding = {
  step: 0,
  demoBreaths: 0,
  selectedHabits: [],
  goal: null,
  lastKey: '',
}

function progressHTML() {
  return `<div class="onboarding-progress" aria-hidden="true">
    ${[0, 1, 2, 3].map(i => `<div class="onboarding-dot ${i < onboarding.step ? 'is-done' : i === onboarding.step ? 'is-current' : ''}"></div>`).join('')}
  </div>`
}

function overlayHTML() {
  const settings = getSettings()
  const habits = getHabits()
  const step = onboarding.step

  if (step === 0) {
    return `<div class="onboarding-shell"><div class="onboarding-inner">
      ${progressHTML()}
      <p class="onboarding-kicker">Paso 1 de 4</p>
      <h2 class="onboarding-title">Tu viaje empieza aquí</h2>
      <p class="onboarding-desc">Mejora es tu sistema de crecimiento personal: hábitos, mente, calma y metas en un solo lugar.</p>
      <div class="onboarding-visual"><span class="onboarding-logo" aria-hidden="true">✦</span></div>
      <input id="onboard-name" class="input-field mb-3" placeholder="¿Cómo te llamas?" value="${esc(settings.userName || '')}" autocomplete="name">
      <div class="onboarding-actions">
        <button onclick="onboardNext()" class="btn-primary w-full">Comenzar mi viaje</button>
      </div>
    </div></div>`
  }
  if (step === 1) {
    return `<div class="onboarding-shell"><div class="onboarding-inner">
      ${progressHTML()}
      <p class="onboarding-kicker">Paso 2 de 4 · Prueba express</p>
      <h2 class="onboarding-title">Respira conmigo</h2>
      <p class="onboarding-desc">Tres respiraciones conscientes. Así se siente una mini-rutina de calma.</p>
      <div class="onboarding-visual">
        <div class="onboarding-breathe-ring">${onboarding.demoBreaths >= 3 ? '✨' : '🌬️'}</div>
      </div>
      <p class="text-center text-main mb-3 font-medium">${onboarding.demoBreaths}/3 completadas</p>
      <div class="onboarding-actions">
        <button onclick="onboardDemoBreath()" class="btn-primary w-full" ${onboarding.demoBreaths >= 3 ? 'disabled' : ''}>
          ${onboarding.demoBreaths >= 3 ? 'Listo' : 'Inhalar… exhalar'}
        </button>
        <button onclick="onboardNext()" class="btn-secondary w-full" ${onboarding.demoBreaths < 3 ? 'disabled' : ''}>Continuar</button>
      </div>
    </div></div>`
  }
  if (step === 2) {
    return `<div class="onboarding-shell"><div class="onboarding-inner">
      ${progressHTML()}
      <p class="onboarding-kicker">Paso 3 de 4 · Hábitos</p>
      <h2 class="onboarding-title">Elige tus hábitos</h2>
      <p class="onboarding-desc">Selecciona hasta 3 rutinas para empezar. Puedes cambiarlas después.</p>
      <div class="onboarding-habit-grid">
        ${habits.map(h => `<button type="button" onclick="toggleOnboardHabit('${h.id}')" class="onboarding-habit-btn ${onboarding.selectedHabits.includes(h.id) ? 'is-selected' : ''}">
          <span>${h.icon}</span><span class="flex-1">${esc(h.name)}</span>
          ${onboarding.selectedHabits.includes(h.id) ? '✓' : ''}
        </button>`).join('')}
      </div>
      <div class="onboarding-actions">
        <button onclick="onboardNext()" class="btn-primary w-full" ${onboarding.selectedHabits.length < 1 ? 'disabled' : ''}>Continuar (${onboarding.selectedHabits.length}/3)</button>
      </div>
    </div></div>`
  }
  return `<div class="onboarding-shell"><div class="onboarding-inner">
    ${progressHTML()}
    <p class="onboarding-kicker">Paso 4 de 4 · Meta</p>
    <h2 class="onboarding-title">Tu primera meta</h2>
    <p class="onboarding-desc">Un objetivo a 30 días te mantiene enfocado. Elige uno para comenzar.</p>
    <div class="onboarding-goal-grid">
      ${GOAL_TEMPLATES.slice(0, 4).map((t, i) => `<button type="button" onclick="setOnboardGoal(${i})" class="onboarding-habit-btn ${onboarding.goal === i ? 'is-selected' : ''}">
        <span>${t.icon}</span><span class="flex-1">${t.title}</span>
      </button>`).join('')}
    </div>
    <select id="onboard-reminder" class="input-field mb-3">
      <option value="">Sin recordatorio diario</option>
      ${[7, 8, 9, 12, 18, 20, 21].map(h => `<option value="${h}">${h}:00</option>`).join('')}
    </select>
    <div class="onboarding-actions">
      <button onclick="finishOnboarding()" class="btn-primary w-full" ${onboarding.goal === null ? 'disabled' : ''}>¡Empezar mi viaje!</button>
    </div>
  </div></div>`
}

export function onboardingCacheKey() {
  return `${onboarding.step}|${onboarding.demoBreaths}|${onboarding.selectedHabits.join(',')}|${onboarding.goal}`
}

export function renderOnboardingOverlay() {
  const el = document.getElementById('onboarding-overlay')
  if (!el) return
  if (!needsOnboarding()) {
    if (onboarding.lastKey !== 'off') {
      el.classList.remove('is-active')
      el.innerHTML = ''
      el.setAttribute('aria-hidden', 'true')
      onboarding.lastKey = 'off'
    }
    return
  }
  const key = onboardingCacheKey()
  if (key === onboarding.lastKey) return
  const savedName = document.getElementById('onboard-name')?.value
  onboarding.lastKey = key
  el.classList.add('is-active')
  el.setAttribute('aria-hidden', 'false')
  el.innerHTML = overlayHTML()
  if (savedName && onboarding.step === 0) {
    const input = document.getElementById('onboard-name')
    if (input) input.value = savedName
  }
}

export function resetOnboardingCache() {
  onboarding.lastKey = ''
}
