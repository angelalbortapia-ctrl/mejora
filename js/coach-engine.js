/** Coach premium — contexto personalizado para Hoy y repaso semanal */

import {
  getStreak, getToday, getMood, getWeekNumber,
} from '/js/core.js'
import {
  getNextBestAction, getJourneySummary, getWeeklySummary, getHabitTrendWeeks,
} from '/js/analytics.js'
import { MOOD_COACH, getDailyIntention } from '/js/coaching.js'
import { getWeeklyReviewPrompt } from '/js/content.js'
import { getMeditationStreak, getActiveProgramProgress } from '/js/meditation-service.js'
import { isSessionDoneToday } from '/js/brain-program.js'

function timeOfDay() {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 18) return 'afternoon'
  if (h < 22) return 'evening'
  return 'night'
}

function buildInsight({ streak, mood, weekly, journey, hour }) {
  const parts = []

  if (mood?.id && MOOD_COACH[mood.id]) {
    parts.push(MOOD_COACH[mood.id].insight)
  } else if (streak >= 14) {
    parts.push(`${streak} días seguidos — estás en territorio de hábito real.`)
  } else if (streak >= 7) {
    parts.push(`Racha de ${streak} días. La consistencia ya es tu ventaja.`)
  } else if (streak === 0 && journey.daysSinceStart > 2) {
    parts.push('Un día activo hoy vale más que planear la semana perfecta.')
  }

  if (weekly.activeDays <= 2 && journey.daysSinceStart > 7) {
    parts.push('Esta semana ha sido ligera — una misión pequeña puede cambiar el ritmo.')
  }

  if (hour >= 21 && !isSessionDoneToday()) {
    parts.push('Cierra con calma: 5 min de respiración mejoran el sueño.')
  } else if (hour < 10) {
    parts.push(getDailyIntention())
  }

  return parts[0] || 'Un paso claro ahora > diez intenciones después.'
}

/** Tarjeta principal de Hoy con capa de coach */
export function getPremiumCoach() {
  let action = getNextBestAction()
  const streak = getStreak()
  const mood = getMood(getToday())
  const hour = new Date().getHours()
  const weekly = getWeeklySummary()
  const journey = getJourneySummary()
  const trends = getHabitTrendWeeks(2)
  const habitDelta = (trends[1]?.percent || 0) - (trends[0]?.percent || 0)
  const medStreak = getMeditationStreak()
  const activeProg = getActiveProgramProgress()

  let insight = buildInsight({ streak, mood, weekly, journey, hour })

  if (mood?.id === 1 && action.priority !== 'done') {
    action = {
      ...action,
      icon: '🫧',
      title: 'Primero, baja el ritmo',
      desc: 'Tres minutos de calma antes de exigirte más.',
      link: '#/meditacion',
      cta: 'Ir a Calma',
      priority: 'high',
    }
  } else if (hour >= 20 && action.priority === 'medium' && action.link === '#/gimnasia') {
    action = {
      ...action,
      desc: 'Si el día fue intenso, prioriza calma y cierra con una sesión breve.',
      link: '#/meditacion',
      cta: 'Meditar ahora',
    }
  }

  const chips = []
  if (streak > 0) chips.push({ icon: '🔥', label: `${streak}d racha` })
  if (medStreak > 0) chips.push({ icon: '🫧', label: `${medStreak}d calma` })
  if (habitDelta > 5) chips.push({ icon: '📈', label: 'Hábitos ↑' })
  if (activeProg && !activeProg.done) chips.push({ icon: '◎', label: 'Programa activo' })

  return {
    ...action,
    insight,
    chips,
    tone: action.priority === 'done' ? 'success' : mood?.id === 1 ? 'gentle' : 'focus',
  }
}

const WEEKLY_ACTIONS = [
  {
    title: 'Refuerza un hábito',
    desc: 'Elige el hábito que más te costó esta semana y bájale la meta un 20%.',
    link: '#/mejora',
    cta: 'Ajustar hábitos',
  },
  {
    title: 'Bloque de enfoque',
    desc: 'Reserva 3 bloques de 25 min la próxima semana — mismo horario cada día.',
    link: '#/enfoque',
    cta: 'Modo enfoque',
  },
  {
    title: 'Programa de calma',
    desc: 'Instala una rutina antiestrés de 7 días si la semana fue pesada.',
    link: '#/meditacion',
    cta: 'Ver programas',
    onclick: "startMedProgram('calm-7');navigate('/meditacion/programa/calm-7')",
  },
  {
    title: 'Meta concreta',
    desc: 'Convierte tu reflexión en una meta medible para los próximos 7 días.',
    link: '#/metas',
    cta: 'Definir meta',
  },
]

/** Sugerencia accionable tras repaso semanal */
export function getWeeklyReviewSuggestion(note = '') {
  const week = getWeekNumber()
  const base = WEEKLY_ACTIONS[week % WEEKLY_ACTIONS.length]
  const prompt = getWeeklyReviewPrompt(week)
  const lower = (note || '').toLowerCase()

  if (/estrés|estres|ansiedad|presión|presion|agotad/.test(lower)) {
    return {
      ...WEEKLY_ACTIONS[2],
      desc: 'Tu nota menciona carga emocional — el protocolo de 14 días puede ayudarte.',
      onclick: "startMedProgram('calm-stress-14');navigate('/meditacion/programa/calm-stress-14')",
    }
  }
  if (/hábito|habito|rutina|constancia/.test(lower)) {
    return WEEKLY_ACTIONS[0]
  }
  if (/foco|concentr|trabajo|productiv/.test(lower)) {
    return WEEKLY_ACTIONS[1]
  }
  if (/meta|objetiv|logro|quiero/.test(lower)) {
    return WEEKLY_ACTIONS[3]
  }

  return { ...base, reflectPrompt: prompt }
}
