import {
  getItem, getToday, toDateStr, getStats, getStreak, getHabits, isHabitComplete,
  getGoals, getPlanProgress, ensureDailyPlan, getMood, getCompletedHabitsCount,
  isRoutineDoneToday,
} from '/js/core.js'
import { getProgramStats, isSessionDoneToday } from '/js/brain-program.js'

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
  for (let i = 0; i < 7; i++) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const ds = toDateStr(d)
    const types = log[ds] || []
    if (types.length) activeDays++
    if (types.includes('brain')) brainCount++
    const mood = getItem(`mood_${ds}`, null)
    if (mood) moods.push(mood)
    if (habits.length && habits.some(h => isHabitComplete(h, ds))) habitDays++
  }

  const moodAvg = moods.length
    ? Math.round(moods.reduce((a, b) => a + b, 0) / moods.length * 10) / 10
    : null
  const prevTrend = getHabitTrendWeeks(2)
  const habitDelta = (prevTrend[1]?.percent || 0) - (prevTrend[0]?.percent || 0)

  let topHabit = null
  let topHabitDays = 0
  for (const h of habits) {
    let days = 0
    for (let i = 0; i < 7; i++) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      if (isHabitComplete(h, toDateStr(d))) days++
    }
    if (days > topHabitDays) { topHabitDays = days; topHabit = h }
  }

  const parts = []
  if (activeDays >= 6) parts.push(`Semana sólida: activo ${activeDays}/7 días. Tu sistema diario está tomando forma.`)
  else if (activeDays >= 4) parts.push(`Esta semana estuviste presente ${activeDays} de 7 días — ritmo intermedio con margen de mejora.`)
  else if (activeDays >= 1) parts.push(`Semana ligera (${activeDays}/7 días activos). No te castigues: un día fuerte puede cambiar la tendencia.`)
  else parts.push('Semana sin actividad registrada. La rutina express de 5 min es el reinicio más fácil.')

  if (topHabit && topHabitDays >= 2) {
    parts.push(`Tu hábito más constante fue «${topHabit.name}» (${topHabitDays}/7). Duplica esfuerzo ahí antes de añadir otro.`)
  } else if (habits.length && habitDays === 0) {
    parts.push('Ningún hábito se completó esta semana — elige solo uno para la próxima y redúcelo a 2 minutos.')
  }

  if (brainCount >= 3) parts.push(`${brainCount} sesiones cerebrales: tu atención y memoria de trabajo están recibiendo estímulo real.`)
  else if (brainCount > 0) parts.push(`${brainCount} sesión${brainCount > 1 ? 'es' : ''} cerebral — intenta 2 la próxima semana para ver patrones.`)
  else parts.push('Sin entrenamiento cognitivo esta semana. Una sesión de 15 min el miércoles puede ser tu ancla.')

  if (moodAvg) {
    if (moodAvg >= 3.5) parts.push(`Ánimo promedio alto (${moodAvg}/4). Buen momento para metas ambiciosas o dificultad experta.`)
    else if (moodAvg < 2.5) parts.push(`Ánimo bajo (${moodAvg}/4). Prioriza calma y hábitos mínimos — no grandes cambios.`)
  }

  if (habitDelta > 5) parts.push('Tus hábitos mejoraron vs. la semana pasada. Mantén el plan del día como ancla.')
  else if (habitDelta < -5) parts.push('Hábitos por debajo de la semana anterior. Revisa si la meta es demasiado alta.')

  return {
    activeDays,
    habitDays,
    brainCount,
    moodAvg,
    habitDelta,
    narrative: parts.join(' '),
    topHabit: topHabit?.name,
    topHabitDays,
  }
}

export function getNextBestAction() {
  const plan = ensureDailyPlan()
  const progress = getPlanProgress()
  const hour = new Date().getHours()
  const mood = getMood()
  const habitsDone = getCompletedHabitsCount()
  const habitsTotal = getHabits().length
  if (progress.allDone) {
    return {
      icon: '✨',
      title: 'Día completo',
      desc: 'Hiciste lo que tenías pendiente. Descansa o mira cómo vas.',
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
      desc: pending.brief || pending.why || `+${pending.xp} XP al completar esta misión.`,
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
  const weekly = getWeeklySummary()
  const goals = getGoals().filter(g => g.active)

  if (s.daysSinceStart < 7) {
    return `Día ${s.daysSinceStart} de tu camino. Los primeros 7 días no miden talento — miden si vuelves. Una rutina express cuenta igual que una completa.`
  }
  if (s.consistency30 >= 80) {
    const extra = s.brainSessions < 20
      ? ' Tu siguiente nivel: más neurociencia aplicada o metas de 90 días.'
      : goals.length < 2 ? ' Considera una segunda meta activa para canalizar esta consistencia.' : ''
    return `Consistencia del ${s.consistency30}% en 30 días — estás en el 10% superior de quienes empiezan apps de hábitos.${extra}`
  }
  if (s.consistency30 >= 50) {
    if (habitDelta > 5) return `Hábitos en alza (+${habitDelta}% vs. semana pasada). ${weekly.topHabit ? `«${weekly.topHabit}» es tu ancla — protégelo.` : 'Mantén el plan del día como ritual, no como lista.'}`
    if (s.streak >= 5) return `Racha de ${s.streak} días con consistencia media (${s.consistency30}%). El siguiente salto es completar el plan entero 3 días seguidos.`
    return `Ritmo intermedio (${s.consistency30}% consistencia). Prioriza cerrar el plan antes de añadir actividades — la profundidad gana a la amplitud.`
  }
  if (s.streak >= 3) return `Racha de ${s.streak} días activa. Un mal día no la rompe — no volver mañana sí.`
  return 'Reinicio suave: rutina express (5 min) + 2 hábitos. Tres victorias pequeñas > un plan perfecto abandonado.'
}

export function getMilestones() {
  const s = getJourneySummary()
  const defs = [
    { id: 'd7', label: '7 días en el camino', icon: '🌱', check: () => s.daysSinceStart >= 7 },
    { id: 'd30', label: '30 días de viaje', icon: '📅', check: () => s.daysSinceStart >= 30 },
    { id: 'streak14', label: 'Racha de 14 días', icon: '🔥', check: () => s.streak >= 14 },
    { id: 'brain10', label: '10 sesiones cerebrales', icon: '🧠', check: () => s.brainSessions >= 10 },
    { id: 'habits50', label: '50 hábitos completados', icon: '✅', check: () => s.habitsCompleted >= 50 },
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
