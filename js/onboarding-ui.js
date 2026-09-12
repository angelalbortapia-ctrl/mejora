/** Inducción FORGE — guía de primer uso */

import {
  esc, getSettings, saveSettings, getHabits, setItem, needsOnboarding, GOAL_TEMPLATES,
} from './core.js'

export const TOTAL_ONBOARD_STEPS = 8

export const onboarding = {
  step: 0,
  selectedHabits: [],
  goal: null,
  lastKey: '',
  /** true cuando el usuario pide reabrir la guía manualmente */
  forced: false,
}

const PILLARS = [
  { icon: '◎', label: 'Hoy', desc: 'Plan del día y resumen' },
  { icon: '✓', label: 'Hábitos', desc: 'Ejecuta sin excusas' },
  { icon: '⬡', label: 'Escuela', desc: 'Neurociencia + cerebro' },
  { icon: '◇', label: 'Calma', desc: 'Meditación bajo presión' },
  { icon: '↑', label: 'Tú', desc: 'XP, rangos y metas' },
]

const COUNTRIES = [
  ['MX', 'México'], ['ES', 'España'], ['AR', 'Argentina'], ['CO', 'Colombia'],
  ['CL', 'Chile'], ['PE', 'Perú'], ['US', 'Estados Unidos'],
]

function progressHTML() {
  const n = TOTAL_ONBOARD_STEPS
  return `<div class="onboarding-progress" aria-hidden="true">
    ${Array.from({ length: n }, (_, i) =>
      `<div class="onboarding-dot ${i < onboarding.step ? 'is-done' : i === onboarding.step ? 'is-current' : ''}"></div>`
    ).join('')}
  </div>`
}

function stepLabel(n, tag = '') {
  return `<p class="onboarding-kicker">Paso ${n + 1} de ${TOTAL_ONBOARD_STEPS}${tag ? ` · ${tag}` : ''}</p>`
}

function actionsHTML(primaryLabel, primaryFn, opts = {}) {
  const { primaryDisabled = false, showBack = onboarding.step > 0, secondaryLabel, secondaryFn } = opts
  return `<div class="onboarding-actions">
    <button type="button" onclick="${primaryFn}()" class="btn-primary w-full" ${primaryDisabled ? 'disabled' : ''}>${primaryLabel}</button>
    ${secondaryLabel ? `<button type="button" onclick="${secondaryFn}()" class="btn-secondary w-full">${secondaryLabel}</button>` : ''}
    ${showBack ? `<button type="button" onclick="onboardBack()" class="btn-ghost w-full text-sm">← Atrás</button>` : ''}
  </div>`
}

function overlayHTML() {
  const settings = getSettings()
  const habits = getHabits()
  const step = onboarding.step

  if (step === 0) {
    return `<div class="onboarding-shell"><div class="onboarding-inner">
      ${progressHTML()}
      ${stepLabel(0, 'Bienvenida')}
      <h2 class="onboarding-title">Mejora · FORGE</h2>
      <p class="onboarding-desc">No es otra app de motivación. Es un <strong>sistema diario</strong>: plan claro, ejecutas, ves progreso y ajustas. Oscuro, directo, sin ruido.</p>
      <div class="onboarding-visual onboarding-visual--brand"><span class="onboarding-logo-mark" aria-hidden="true">M</span></div>
      <ul class="onboarding-info-list">
        <li><span class="onboarding-info-icon">1</span> Cada día: <strong>4 misiones</strong> + bonus XP</li>
        <li><span class="onboarding-info-icon">2</span> Cuatro habilidades: mente, calma, disciplina, sabiduría</li>
        <li><span class="onboarding-info-icon">3</span> Todo se guarda en tu dispositivo (offline)</li>
      </ul>
      ${actionsHTML('Empezar la guía', 'onboardNext')}
    </div></div>`
  }

  if (step === 1) {
    return `<div class="onboarding-shell"><div class="onboarding-inner">
      ${progressHTML()}
      ${stepLabel(1, 'Perfil')}
      <h2 class="onboarding-title">¿Cómo te llamas?</h2>
      <p class="onboarding-desc">Aparecerá en tu perfil y en el saludo del inicio. Puedes cambiarlo después en Ajustes.</p>
      <input id="onboard-name" class="input-field mb-3" placeholder="Tu nombre" value="${esc(settings.userName || '')}" autocomplete="name">
      ${actionsHTML('Continuar', 'onboardNext', { primaryDisabled: false })}
    </div></div>`
  }

  if (step === 2) {
    return `<div class="onboarding-shell"><div class="onboarding-inner">
      ${progressHTML()}
      ${stepLabel(2, 'Cómo funciona')}
      <h2 class="onboarding-title">El motor: Plan del día</h2>
      <p class="onboarding-desc">Cada mañana aparecen <strong>4 misiones</strong>. Completa las 4 y ganas <strong>+80 XP bonus</strong>.</p>
      <div class="onboarding-mission-demo">
        <div class="onboarding-mission-row"><span>⚔️</span><span>Rutina matutina</span><span class="onboarding-mission-xp">+50</span></div>
        <div class="onboarding-mission-row"><span>✅</span><span>2 hábitos</span><span class="onboarding-mission-xp">+35</span></div>
        <div class="onboarding-mission-row is-rotating"><span>🧠</span><span>2 misiones que rotan</span><span class="onboarding-mission-xp">+30–45</span></div>
      </div>
      <p class="onboarding-hint">La barra del banner muestra tu avance (ej. 2/4). La <strong>racha</strong> cuenta días seguidos con actividad.</p>
      ${actionsHTML('Entendido', 'onboardNext')}
    </div></div>`
  }

  if (step === 3) {
    return `<div class="onboarding-shell"><div class="onboarding-inner">
      ${progressHTML()}
      ${stepLabel(3, 'Mapa')}
      <h2 class="onboarding-title">Qué encontrarás</h2>
      <p class="onboarding-desc">Cinco secciones. La barra inferior en móvil repite las mismas.</p>
      <div class="onboarding-pillar-grid">
        ${PILLARS.map(p => `<div class="onboarding-pillar">
          <span class="onboarding-pillar-icon">${p.icon}</span>
          <strong>${p.label}</strong>
          <span>${p.desc}</span>
        </div>`).join('')}
      </div>
      <p class="onboarding-hint">Atajos: <strong>⌘K</strong> o el botón ⌕ en el banner para buscar lecciones y meditaciones.</p>
      ${actionsHTML('Siguiente', 'onboardNext')}
    </div></div>`
  }

  if (step === 4) {
    return `<div class="onboarding-shell"><div class="onboarding-inner">
      ${progressHTML()}
      ${stepLabel(4, 'Configuración')}
      <h2 class="onboarding-title">Configura lo básico</h2>
      <p class="onboarding-desc">Opcional, pero recomendado la primera vez.</p>
      <label class="onboarding-field-label">País (clima y festivos)
        <select id="onboard-country" class="input-field mt-1">
          ${COUNTRIES.map(([code, name]) =>
            `<option value="${code}" ${(settings.country || 'MX') === code ? 'selected' : ''}>${name}</option>`
          ).join('')}
        </select>
      </label>
      <label class="onboarding-field-label mt-3">Recordatorio del plan
        <select id="onboard-reminder" class="input-field mt-1">
          <option value="">Sin recordatorio</option>
          ${[7, 8, 9, 12, 18, 19, 20, 21].map(h =>
            `<option value="${h}" ${settings.reminderHour === h ? 'selected' : ''}>${h}:00</option>`
          ).join('')}
        </select>
      </label>
      <label class="onboarding-check-row mt-3">
        <input type="checkbox" id="onboard-sound" ${settings.sound !== false ? 'checked' : ''}>
        <span>Sonidos de feedback (clics, éxito)</span>
      </label>
      <label class="onboarding-check-row mt-2">
        <input type="checkbox" id="onboard-motion" ${settings.reducedMotion ? 'checked' : ''}>
        <span>Reducir animaciones</span>
      </label>
      ${actionsHTML('Guardar y continuar', 'onboardNext')}
    </div></div>`
  }

  if (step === 5) {
    return `<div class="onboarding-shell"><div class="onboarding-inner">
      ${progressHTML()}
      ${stepLabel(5, 'Hábitos')}
      <h2 class="onboarding-title">Tus hábitos iniciales</h2>
      <p class="onboarding-desc">Elige 1 a 3. Los contadores (agua, lectura) se marcan con +; los demás con un check.</p>
      <div class="onboarding-habit-grid">
        ${habits.map(h => `<button type="button" onclick="toggleOnboardHabit('${h.id}')" class="onboarding-habit-btn ${onboarding.selectedHabits.includes(h.id) ? 'is-selected' : ''}">
          <span>${h.icon}</span><span class="flex-1">${esc(h.name)}</span>
          ${onboarding.selectedHabits.includes(h.id) ? '✓' : ''}
        </button>`).join('')}
      </div>
      ${actionsHTML(`Continuar (${onboarding.selectedHabits.length}/3)`, 'onboardNext', {
        primaryDisabled: onboarding.selectedHabits.length < 1,
      })}
    </div></div>`
  }

  if (step === 6) {
    return `<div class="onboarding-shell"><div class="onboarding-inner">
      ${progressHTML()}
      ${stepLabel(6, 'Meta')}
      <h2 class="onboarding-title">Tu primera meta</h2>
      <p class="onboarding-desc">Un objetivo a 30–90 días. Máximo 3 activas; puedes cambiarla en <strong>Tú → Metas</strong>.</p>
      <div class="onboarding-goal-grid">
        ${GOAL_TEMPLATES.slice(0, 4).map((t, i) => `<button type="button" onclick="setOnboardGoal(${i})" class="onboarding-habit-btn ${onboarding.goal === i ? 'is-selected' : ''}">
          <span>${t.icon}</span><span class="flex-1">${t.title}</span>
        </button>`).join('')}
      </div>
      ${actionsHTML('Continuar', 'onboardNext', { primaryDisabled: onboarding.goal === null })}
    </div></div>`
  }

  return `<div class="onboarding-shell"><div class="onboarding-inner">
    ${progressHTML()}
    ${stepLabel(7, 'Primer día')}
    <h2 class="onboarding-title">Tu checklist de hoy</h2>
    <p class="onboarding-desc">No intentes usar todo a la vez. Este es el orden recomendado:</p>
    <ol class="onboarding-checklist">
      <li><strong>Plan del día</strong> — mira las 4 misiones en el banner o en Plan</li>
      <li><strong>Rutina</strong> — sesión matutina (misión principal)</li>
      <li><strong>Hábitos</strong> — marca al menos 2</li>
      <li><strong>Escuela o Calma</strong> — cuando tengas 10 minutos</li>
    </ol>
    <p class="onboarding-hint">Después del tour verás la app real. Puedes repetir la guía en <strong>Ajustes → Datos</strong>.</p>
    ${actionsHTML('¡Entrar a Mejora!', 'finishOnboarding')}
  </div></div>`
}

export function onboardingCacheKey() {
  return `${onboarding.step}|${onboarding.selectedHabits.join(',')}|${onboarding.goal}`
}

export function shouldShowOnboarding() {
  if (onboarding.forced) return true
  return needsOnboarding()
}

export function renderOnboardingOverlay() {
  const el = document.getElementById('onboarding-overlay')
  if (!el) return
  if (!shouldShowOnboarding()) {
    if (onboarding.lastKey !== 'off') {
      el.classList.remove('is-active')
      el.innerHTML = ''
      el.setAttribute('aria-hidden', 'true')
      onboarding.lastKey = 'off'
      document.body.classList.remove('onboarding-open')
    }
    return
  }
  document.body.classList.add('onboarding-open')
  const key = onboardingCacheKey()
  if (key === onboarding.lastKey) return
  const savedName = document.getElementById('onboard-name')?.value
  onboarding.lastKey = key
  el.classList.add('is-active')
  el.setAttribute('aria-hidden', 'false')
  el.innerHTML = overlayHTML()
  if (savedName && onboarding.step === 1) {
    const input = document.getElementById('onboard-name')
    if (input) input.value = savedName
  }
}

export function resetOnboardingCache() {
  onboarding.lastKey = ''
}

/** Reabrir guía completa (Ajustes → Datos). */
export function restartOnboarding() {
  onboarding.step = 0
  onboarding.selectedHabits = []
  onboarding.goal = null
  onboarding.lastKey = ''
  onboarding.forced = true
  const s = getSettings()
  s.onboardingComplete = false
  s.tourComplete = false
  saveSettings(s)
  setItem('tourSkipped', false)
  document.body.classList.add('onboarding-open')
}
