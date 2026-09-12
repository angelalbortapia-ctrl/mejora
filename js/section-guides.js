/** Guías in-app por sección (post-onboarding) */

import { getItem, setItem, needsOnboarding } from './core.js'
import { navigate } from './router.js'

const SECTIONS = {
  rutina: {
    route: '/rutina',
    label: 'Rutina',
    steps: [
      { title: 'Tu ritual diario', text: 'Respiración guiada, Stroop rápido y reflexión. Completa la rutina para XP en mindfulness, mente y sabiduría.', highlight: '.page-routine, #app-content' },
      { title: 'Dificultad', text: 'Elige nivel antes de empezar. Más difícil = más tiempo de respiración y preguntas más profundas.', highlight: '.routine-intro-main, .routine-intro-grid' },
      { title: 'Modo Express', text: '¿Poco tiempo? Desde el Plan del día puedes hacer una versión de 5 minutos.', highlight: '.plan-express', optional: true },
    ],
  },
  gimnasia: {
    route: '/gimnasia',
    label: 'Escuela',
    steps: [
      { title: 'Escuela cerebral', text: 'Lecciones con neurociencia, laboratorio de ejercicios y biblioteca de papers.', highlight: '#app-content' },
      { title: 'Currículo', text: 'Avanza por facultades y desbloquea lecciones. Cada lección suma XP mental.', highlight: '.school-hub, .page-school', optional: true },
      { title: 'Laboratorio', text: 'Protocolos con evidencia: N-back, Stroop, Flanker y más.', highlight: '.brain-lab, .school-nav', optional: true },
    ],
  },
  mejora: {
    route: '/mejora',
    label: 'Hábitos',
    steps: [
      { title: 'Hábitos de hoy', text: 'Marca cada hábito al completarlo. Ganas XP de disciplina y alimentas tu racha.', highlight: '.habits-grid, .page-mejora' },
      { title: 'Contadores', text: 'Algunos hábitos son contadores (ej. vasos de agua). Usa +/− en lugar del check.', highlight: '.habit-counter', optional: true },
      { title: 'Editar', text: 'Personaliza iconos, categorías, dificultad y XP. Agrega plantillas sugeridas.', highlight: '.ds-toolbar' },
    ],
  },
  plan: {
    route: '/plan',
    label: 'Plan del día',
    steps: [
      { title: '4 misiones', text: 'Cada día tienes 4 tareas. Completa las 4 para bonus +80 XP.', highlight: '.plan-missions' },
      { title: 'Progreso', text: 'La barra muestra tu avance. Las misiones te llevan directo a cada sección.', highlight: '.plan-progress' },
      { title: 'Misión semanal', text: 'Activo 5 días a la semana → +200 XP extra.', highlight: '.plan-weekly', optional: true },
    ],
  },
  calma: {
    route: '/meditacion',
    label: 'Calma',
    steps: [
      { title: 'Hub de Calma', text: 'Sesiones guiadas, programas multi-día, timer libre y registro de sueño.', highlight: '.calma-hero, .calma-viewport' },
      { title: 'Programas', text: 'Rutas de varios días con progreso guardado. Ideal para construir hábito.', highlight: '.calma-section--programs, .calma-program-card', optional: true },
      { title: 'Timer libre', text: 'Meditación sin guía con sonidos ambientales opcionales.', highlight: '.calma-quick-btn', optional: true },
    ],
  },
  enfoque: {
    route: '/enfoque',
    label: 'Enfoque',
    steps: [
      { title: 'Modo enfoque', text: 'Pomodoro de 25 min + descanso de 5. Una tarea, cero notificaciones.', highlight: '.page-enfoque, .enfoque-dashboard' },
      { title: 'Temporizador', text: 'Inicia, pausa o reinicia. El anillo muestra el tiempo restante del bloque.', highlight: '.enfoque-timer' },
      { title: 'Sesiones', text: 'Cada bloque completado suma a tu historial y refuerza el hábito de trabajo profundo.', highlight: '.enfoque-info', optional: true },
    ],
  },
}

function sectionSeenKey(id) {
  return `sectionGuide_${id}`
}

export function shouldShowSectionGuide(id) {
  return !getItem(sectionSeenKey(id), false)
}

export function markSectionGuideSeen(id) {
  setItem(sectionSeenKey(id), true)
}

export function resetSectionGuides() {
  Object.keys(SECTIONS).forEach(id => setItem(sectionSeenKey(id), false))
}

export function listSectionGuides() {
  return Object.entries(SECTIONS).map(([id, s]) => ({ id, label: s.label, route: s.route }))
}

export function startSectionGuide(id, onDone) {
  const section = SECTIONS[id]
  if (!section) return

  const overlay = document.getElementById('tour-overlay')
  if (!overlay) return

  if (location.hash.replace('#', '') !== section.route) {
    navigate(section.route)
    setTimeout(() => startSectionGuide(id, onDone), 500)
    return
  }

  let step = 0
  const steps = section.steps

  const clearHighlight = () => {
    document.querySelectorAll('.tour-highlight').forEach(el => el.classList.remove('tour-highlight'))
  }

  const finish = () => {
    clearHighlight()
    overlay.classList.remove('active')
    overlay.innerHTML = ''
    markSectionGuideSeen(id)
    onDone?.()
  }

  const renderStep = () => {
    while (step < steps.length && steps[step].optional && !document.querySelector(steps[step].highlight)) {
      step++
    }
    if (step >= steps.length) {
      finish()
      return
    }

    const s = steps[step]
    clearHighlight()
    document.querySelector(s.highlight)?.classList.add('tour-highlight')

    overlay.classList.add('active')
    overlay.innerHTML = `
      <div class="tour-card tour-card--light animate-slide-up" role="dialog" aria-labelledby="section-guide-title">
        <p class="tour-step-label">Guía · ${section.label} · ${step + 1} de ${steps.length}</p>
        <h3 class="tour-title" id="section-guide-title">${s.title}</h3>
        <p class="tour-text">${s.text}</p>
        <div class="tour-actions">
          <button type="button" class="btn-ghost" id="section-guide-skip">Saltar</button>
          <button type="button" class="btn-primary" id="section-guide-next">${step < steps.length - 1 ? 'Siguiente' : 'Listo'}</button>
        </div>
      </div>`

    document.getElementById('section-guide-skip')?.addEventListener('click', finish)
    document.getElementById('section-guide-next')?.addEventListener('click', () => {
      step++
      if (step >= steps.length) finish()
      else renderStep()
    })
  }

  setTimeout(renderStep, 200)
}

export function maybeAutoSectionGuide(path) {
  if (needsOnboarding()) return
  if (document.querySelector('.onboarding-overlay.is-active')) return
  const entry = Object.entries(SECTIONS).find(([, s]) => s.route === path)
  if (!entry) return
  const [id] = entry
  if (!shouldShowSectionGuide(id)) return
  setTimeout(() => startSectionGuide(id), 1200)
}
