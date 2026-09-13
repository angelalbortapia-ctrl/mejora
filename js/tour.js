import { getSettings, saveSettings, setItem, getItem } from '/js/core.js'

const STEPS = [
  {
    title: 'Navegación',
    text: 'Hoy, Hábitos, Escuela, Calma y Tú. En móvil, la misma barra abajo.',
    highlight: '#sidebar-nav',
  },
  {
    title: 'Plan del día',
    text: '4 misiones diarias en el banner. Completa las 4 para el bonus +80 XP.',
    highlight: '.banner-metric-plan, #home-plan-pill',
  },
  {
    title: 'Continuar plan',
    text: 'Un clic te lleva a la siguiente misión pendiente.',
    highlight: '#banner-cta',
  },
  {
    title: 'Pantalla Hoy',
    text: 'Resumen del día, ánimo, hábitos y la siguiente acción recomendada.',
    highlight: '#app-content',
  },
  {
    title: 'Buscar',
    text: 'Encuentra lecciones, meditaciones y rutas. Atajo: ⌘K o Ctrl+K.',
    highlight: '.banner-search-btn',
    optional: true,
  },
]

export function shouldShowTour() {
  const s = getSettings()
  return s.onboardingComplete && !s.tourComplete && !getItem('tourSkipped', false)
}

export function startTour(onStep) {
  let step = 0
  const overlay = document.getElementById('tour-overlay')
  if (!overlay) return

  const clearHighlight = () => {
    document.querySelectorAll('.tour-highlight').forEach(el => el.classList.remove('tour-highlight'))
  }

  const renderStep = () => {
    while (step < STEPS.length && STEPS[step].optional && !document.querySelector(STEPS[step].highlight)) {
      step++
    }
    if (step >= STEPS.length) {
      clearHighlight()
      finishTour()
      return
    }

    const s = STEPS[step]
    clearHighlight()
    const target = document.querySelector(s.highlight)
    target?.classList.add('tour-highlight')

    overlay.classList.add('active')
    overlay.innerHTML = `
      <div class="tour-card tour-card--light animate-slide-up" role="dialog" aria-labelledby="tour-title">
        <p class="tour-step-label">Tour · ${step + 1} de ${STEPS.length}</p>
        <h3 class="tour-title" id="tour-title">${s.title}</h3>
        <p class="tour-text">${s.text}</p>
        <div class="tour-actions">
          <button type="button" class="btn-ghost" id="tour-skip">Saltar tour</button>
          <button type="button" class="btn-primary" id="tour-next">${step < STEPS.length - 1 ? 'Siguiente' : 'Listo'}</button>
        </div>
      </div>`

    document.getElementById('tour-skip')?.addEventListener('click', () => {
      clearHighlight()
      skipTour()
    })
    document.getElementById('tour-next')?.addEventListener('click', () => {
      step++
      if (step >= STEPS.length) {
        clearHighlight()
        finishTour()
      } else {
        renderStep()
        onStep?.(step)
      }
    })
  }

  renderStep()
}

export function finishTour() {
  const overlay = document.getElementById('tour-overlay')
  if (!overlay) return
  overlay.classList.remove('active')
  overlay.innerHTML = ''
  document.querySelectorAll('.tour-highlight').forEach(el => el.classList.remove('tour-highlight'))
  const s = getSettings()
  s.tourComplete = true
  saveSettings(s)
}

function skipTour() {
  setItem('tourSkipped', true)
  finishTour()
}
