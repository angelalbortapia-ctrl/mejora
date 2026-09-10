import {
  getItem, getToday, toDateStr, getStats, getStreak, getHabits, isHabitComplete,
  getGoals, getPlanProgress, ensureDailyPlan, getMood, getCompletedHabitsCount,
  isRoutineDoneToday,
} from './core.js'
import { getProgramStats, isSessionDoneToday } from './brain-program.js'

export function getActivityCalendar(days = 35) {
  const log = getItem('activityLog', {})
  return Array.from({ length: days }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (days - 1 - i))
    const dateStr = toDateStr(d)
    const types = log[dateStr] || []
    const level = types.length === 0 ? 0 : types.length >= 4 ? 3 : types.length >= 2 ? 2 : 1
    return { date: dateStr, count: types.length, types, level, isToday: dateStr === getToday() }
  })
}

export function getConsistencyScore(windowDays = 30) {
  const cal = getActivityCalendar(windowDays)
  return Math.round((cal.filter(d => d.count > 0).length / windowDays) * 100)
}

export function getFirstActivityDate() {
  const log = getItem('activityLog', {})
  return Object.keys(log).filter(d => log[d]?.length).sort()[0] || getToday()
}

export function getDaysSinceStart() {
  const start = new Date(getFirstActivityDate() + 'T12:00:00')
  return Math.max(1, Math.ceil((Date.now() - start) / 86400000) + 1)
}

export function getHabitTrendWeeks(weeks = 4) {
  const habits = getHabits()
  const total = habits.length || 1
  const result = []
  for (let w = weeks - 1; w >= 0; w--) {
    let sum = 0
    for (let d = 0; d < 7; d++) {
      const date = new Date()
      date.setDate(date.getDate() - w * 7 - d)
      const count = habits.filter(h => isHabitComplete(h, toDateStr(date))).length
      sum += (count / total) * 100
    }
    result.push({ week: weeks - w, percent: Math.round(sum / 7) })
  }
  return result
}

export function getWeeklyActivityScores(weeks = 12) {
  const log = getItem('activityLog', {})
  return Array.from({ length: weeks }, (_, wi) => {
    let score = 0
    for (let d = 0; d < 7; d++) {
      const date = new Date()
      date.setDate(date.getDate() - (weeks - 1 - wi) * 7 - d)
      score += (log[toDateStr(date)] || []).length
    }
    return { week: wi + 1, score }
  })
}

export function getJourneySummary() {
  const stats = getStats()
  const goals = getGoals()
  const brain = getProgramStats()
  const cal30 = getActivityCalendar(30)
  return {
    daysSinceStart: getDaysSinceStart(),
    firstActivity: getFirstActivityDate(),
    streak: getStreak(),
    consistency30: getConsistencyScore(30),
    activeDays30: cal30.filter(d => d.count > 0).length,
    totalActiveDays: Object.keys(getItem('activityLog', {})).filter(d => getItem('activityLog', {})[d]?.length).length,
    brainSessions: stats.brainSessions || 0,
    brainWeekSessions: brain.weekSessions || 0,
    habitsCompleted: stats.habitsCompleted || 0,
    reflections: stats.reflections || 0,
    routinesCompleted: stats.routinesCompleted || 0,
    goalsCompleted: goals.filter(g => g.completed).length,
    goalsActive: goals.filter(g => g.active).length,
  }
}

export function getWeeklySummary() {
  const log = getItem('activityLog', {})
  const habits = getHabits()
  const moods = []
  let habitDays = 0
  let activeDays = 0
  let brainCount = 0
  let reflections = 0

  for (let i = 0; i < 7; i++) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const ds = toDateStr(d)
    const types = log[ds] || []
    if (types.length) activeDays++
    if (types.includes('brain')) brainCount++
    if (types.includes('reflection')) reflections++
    const mood = getItem(`mood_${ds}`, null)
    if (mood) moods.push(mood)
    if (habits.length && habits.some(h => isHabitComplete(h, ds))) habitDays++
  }

  const moodAvg = moods.length
    ? Math.round(moods.reduce((a, b) => a + b, 0) / moods.length * 10) / 10
    : null
  const prevTrend = getHabitTrendWeeks(2)
  const habitDelta = (prevTrend[1]?.percent || 0) - (prevTrend[0]?.percent || 0)

  const lines = []
  lines.push(`Esta semana estuviste activo ${activeDays} de 7 días.`)
  if (habitDays > 0) lines.push(`Completaste hábitos en ${habitDays} días.`)
  if (brainCount > 0) lines.push(`${brainCount} sesión${brainCount > 1 ? 'es' : ''} de gimnasia cerebral.`)
  if (reflections > 0) lines.push(`${reflections} reflexión${reflections > 1 ? 'es' : ''} en el diario.`)
  if (moodAvg) lines.push(`Ánimo promedio: ${moodAvg}/4.`)
  if (habitDelta > 5) lines.push('Tus hábitos mejoraron respecto a la semana anterior.')
  else if (habitDelta < -5) lines.push('La semana fue más ligera en hábitos — retoma con el plan de hoy.')

  return {
    activeDays,
    habitDays,
    brainCount,
    reflections,
    moodAvg,
    habitDelta,
    narrative: lines.join(' '),
  }
}

export function getNextBestAction() {
  const plan = ensureDailyPlan()
  const progress = getPlanProgress()
  const hour = new Date().getHours()
  const mood = getMood()
  const habitsDone = getCompletedHabitsCount()
  const habitsTotal = getHabits().length
  const entries = getItem('reflections', [])

  if (progress.allDone) {
    return {
      icon: '✨',
      title: 'Día perfecto',
      desc: 'Plan completo. Revisa tu viaje o repite una sesión cerebral.',
      link: '#/viaje',
      cta: 'Ver mi viaje',
      priority: 'done',
    }
  }

  const pending = plan.tasks.find(t => !t.done)
  if (pending?.type === 'routine' && !isRoutineDoneToday()) {
    return {
      icon: pending.icon,
      title: pending.label,
      desc: hour < 12 ? 'Empieza el día con tu rutina — define el tono.' : 'Tu rutina diaria sigue pendiente.',
      link: pending.link,
      cta: 'Iniciar rutina',
      priority: 'high',
    }
  }

  if (pending?.type === 'habits' && habitsDone < (pending.target || 2)) {
    const need = (pending.target || 2) - habitsDone
    return {
      icon: '✅',
      title: `Completa ${need} hábito${need > 1 ? 's' : ''} más`,
      desc: `Llevas ${habitsDone}/${habitsTotal} hoy. Pequeños pasos, gran impacto.`,
      link: '#/mejora',
      cta: 'Ir a hábitos',
      priority: 'high',
    }
  }

  if (pending?.type === 'brain' && !isSessionDoneToday()) {
    return {
      icon: '🧠',
      title: 'Sesión cerebral',
      desc: hour >= 20 ? 'Cierra el día entrenando tu mente (~20 min).' : 'Fortalece memoria y atención con la sesión guiada.',
      link: '#/gimnasia',
      cta: 'Abrir gimnasia',
      priority: 'medium',
    }
  }

  if (pending?.type === 'reflection') {
    const todayReflect = entries.some(e => e.date?.startsWith(getToday()))
    if (!todayReflect) {
      return {
        icon: '📝',
        title: 'Reflexión del día',
        desc: mood ? 'Cierra el día con 2 minutos de escritura.' : 'Registra tu ánimo y reflexiona brevemente.',
        link: '#/mejora/diario',
        cta: 'Abrir diario',
        priority: 'medium',
      }
    }
  }

  if (!mood && hour >= 8) {
    return {
      icon: '🙂',
      title: '¿Cómo te sientes?',
      desc: 'Registrar tu ánimo ayuda a ver patrones en Mi viaje.',
      link: '#/',
      cta: 'Registrar ánimo',
      priority: 'low',
    }
  }

  if (pending) {
    return {
      icon: pending.icon,
      title: pending.label,
      desc: `+${pending.xp} XP al completar esta misión.`,
      link: pending.link,
      cta: 'Continuar',
      priority: 'medium',
    }
  }

  return {
    icon: '📋',
    title: 'Revisa tu plan',
    desc: 'Mantén el ritmo con las misiones de hoy.',
    link: '#/plan',
    cta: 'Ver plan',
    priority: 'low',
  }
}

export function getJourneyInsight() {
  const s = getJourneySummary()
  const trend = getHabitTrendWeeks(4)
  const habitDelta = (trend[3]?.percent || 0) - (trend[2]?.percent || 0)
  if (s.daysSinceStart < 7) return 'Estás en la fase de arranque. La constancia de los primeros 7 días define tu ritmo futuro.'
  if (s.consistency30 >= 80) return 'Excelente consistencia. Tu sistema diario está consolidado — es momento de subir metas o profundizar en gimnasia cerebral.'
  if (s.consistency30 >= 50) {
    return habitDelta > 5
      ? 'Tus hábitos mejoran semana a semana. Mantén el plan del día como ancla.'
      : 'Ritmo estable. Prioriza completar el plan antes de añadir más actividades.'
  }
  if (s.streak >= 3) return 'Tienes racha activa. Un día a la vez: el viaje se construye con pequeñas victorias repetidas.'
  return 'Retoma con una rutina express o 2 hábitos hoy. La neuroplasticidad responde a la repetición, no a la perfección.'
}

export function getMilestones() {
  const s = getJourneySummary()
  const defs = [
    { id: 'd7', label: '7 días en el camino', icon: '🌱', check: () => s.daysSinceStart >= 7 },
    { id: 'd30', label: '30 días de viaje', icon: '📅', check: () => s.daysSinceStart >= 30 },
    { id: 'streak14', label: 'Racha de 14 días', icon: '🔥', check: () => s.streak >= 14 },
    { id: 'brain10', label: '10 sesiones cerebrales', icon: '🧠', check: () => s.brainSessions >= 10 },
    { id: 'habits50', label: '50 hábitos completados', icon: '✅', check: () => s.habitsCompleted >= 50 },
    { id: 'reflect20', label: '20 reflexiones', icon: '📝', check: () => s.reflections >= 20 },
    { id: 'consistency70', label: '70% consistencia (30d)', icon: '💎', check: () => s.consistency30 >= 70 },
    { id: 'goal1', label: 'Primera meta lograda', icon: '🎯', check: () => s.goalsCompleted >= 1 },
  ]
  return defs.map(m => ({ ...m, done: m.check() }))
}

export function buildMonthlyReport() {
  const s = getJourneySummary()
  const weekly = getWeeklySummary()
  const trends = getHabitTrendWeeks(12)
  const activity = getWeeklyActivityScores(12)
  const goals = getGoals()
  const moods = []
  for (let i = 0; i < 30; i++) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const m = getItem(`mood_${toDateStr(d)}`, null)
    if (m) moods.push({ date: toDateStr(d), value: m })
  }
  return {
    generatedAt: new Date().toISOString(),
    period: '30 días',
    summary: s,
    weekly,
    habitTrend12: trends,
    activityTrend12: activity,
    goals: goals.map(g => ({
      title: g.title,
      progress: g.progress,
      target: g.target,
      active: g.active,
      completed: g.completed,
      milestonesHit: g.milestonesHit || [],
    })),
    moods,
    insight: getJourneyInsight(),
  }
}
