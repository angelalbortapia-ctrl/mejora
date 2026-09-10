import { getSettings, saveSettings, setItem, getItem } from './core.js'

const STEPS = [
  { target: '#sidebar-nav', title: 'Navegación', text: 'Explora Inicio, Plan, Gimnasia, Hábitos y Mi viaje desde aquí.' },
  { target: '#app-banner', title: 'Banner superior', text: 'Tu plan del día, racha y acceso rápido siempre visibles.' },
  { target: '#app-content', title: 'Tu espacio', text: 'Aquí verás misiones, hábitos y progreso. El bloque "Siguiente paso" te guía.' },
  { target: '#banner-cta', title: 'Acción rápida', text: 'Un clic para continuar tu plan del día.' },
]

export function shouldShowTour() {
  const s = getSettings()
  return s.onboardingComplete && !s.tourComplete && !getItem('tourSkipped', false)
}

export function startTour(onStep) {
  let step = 0
  const overlay = document.getElementById('tour-overlay')
  if (!overlay) return

  const renderStep = () => {
    const s = STEPS[step]
    const el = document.querySelector(s.target)
    overlay.classList.add('active')
    overlay.innerHTML = `
      <div class="tour-backdrop"></div>
      <div class="tour-spotlight" id="tour-spotlight"></div>
      <div class="tour-card animate-slide-up">
        <p class="tour-step-label">Paso ${step + 1} de ${STEPS.length}</p>
        <h3 class="tour-title">${s.title}</h3>
        <p class="tour-text">${s.text}</p>
        <div class="tour-actions">
          <button type="button" class="btn-ghost" id="tour-skip">Saltar</button>
          <button type="button" class="btn-primary" id="tour-next">${step < STEPS.length - 1 ? 'Siguiente' : 'Listo'}</button>
        </div>
      </div>`
    positionSpotlight(el)
    document.getElementById('tour-skip')?.addEventListener('click', finishTour)
    document.getElementById('tour-next')?.addEventListener('click', () => {
      step++
      if (step >= STEPS.length) finishTour()
      else {
        renderStep()
        onStep?.(step)
      }
    })
  }

  renderStep()
}

function positionSpotlight(el) {
  const spot = document.getElementById('tour-spotlight')
  if (!spot || !el) return
  const r = el.getBoundingClientRect()
  spot.style.top = `${Math.max(8, r.top - 6)}px`
  spot.style.left = `${Math.max(8, r.left - 6)}px`
  spot.style.width = `${r.width + 12}px`
  spot.style.height = `${r.height + 12}px`
}

export function finishTour() {
  const overlay = document.getElementById('tour-overlay')
  if (!overlay) return
  overlay.classList.remove('active')
  overlay.innerHTML = ''
  const s = getSettings()
  s.tourComplete = true
  saveSettings(s)
}

export function skipTour() {
  setItem('tourSkipped', true)
  finishTour()
}
