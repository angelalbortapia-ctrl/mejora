import { enrichMission } from './coaching.js'

export const PREFIX = 'mejora_'
export const SKILLS = {
  mental: { name: 'Neurociencia', icon: '🧠', color: '#00d4ff' },
  mindfulness: { name: 'Calma', icon: '🧘', color: '#a78bfa' },
  discipline: { name: 'Disciplina', icon: '⚡', color: '#ff8c69' },
  wisdom: { name: 'Sabiduría', icon: '📖', color: '#00f5d4' },
}

export const DIFFICULTIES = {
  facil: { label: 'Fácil', icon: '🌱', mult: 1, xp: 15 },
  medio: { label: 'Medio', icon: '⚡', mult: 1.5, xp: 30 },
  dificil: { label: 'Difícil', icon: '🔥', mult: 2, xp: 55 },
  experto: { label: 'Experto', icon: '💎', mult: 3, xp: 100 },
}

export const RANKS = [
  { min: 1, title: 'Novato', icon: '🌱' },
  { min: 5, title: 'Aprendiz', icon: '📘' },
  { min: 10, title: 'Practicante', icon: '⚡' },
  { min: 20, title: 'Experto', icon: '🏆' },
  { min: 35, title: 'Maestro', icon: '👑' },
  { min: 50, title: 'Leyenda', icon: '💎' },
]

export function getItem(key, fallback = null) {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    return raw ? JSON.parse(raw) : fallback
  } catch { return fallback }
}

export function setItem(key, value) {
  localStorage.setItem(PREFIX + key, JSON.stringify(value))
  if (typeof window !== 'undefined') {
    import('./cloud-sync.js').then(m => m.scheduleCloudPush?.()).catch(() => {})
  }
}

export function toDateStr(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function getToday() {
  return toDateStr(new Date())
}

export function esc(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

export function getProgress() {
  return getItem('progress', {
    xp: { mental: 0, mindfulness: 0, discipline: 0, wisdom: 0 },
    achievements: [],
    records: {},
    habitData: {},
    daily: { date: null, ids: [], done: [] },
    weekly: { week: null, done: 0, target: 7 },
  })
}

export function saveProgress(p) {
  setItem('progress', p)
}

export function xpForLevel(level) {
  return level * level * 80
}

export function getLevel(xp) {
  let level = 1
  while (xp >= xpForLevel(level + 1)) level++
  return level
}

export function getLevelInfo(xp) {
  const level = getLevel(xp)
  const floor = xpForLevel(level)
  const ceiling = xpForLevel(level + 1)
  const percent = Math.min(100, ((xp - floor) / (ceiling - floor)) * 100)
  return { level, xp, floor, ceiling, percent: Math.round(percent) }
}

export function getTotalLevel() {
  const p = getProgress()
  const levels = Object.values(p.xp).map(x => getLevel(x))
  return Math.round(levels.reduce((a, b) => a + b, 0) / levels.length) || 1
}

export function getRank(level = getTotalLevel()) {
  let rank = RANKS[0]
  for (const r of RANKS) if (level >= r.min) rank = r
  return rank
}

export function addXp(skill, baseXp, source = '') {
  const p = getProgress()
  const before = getLevel(p.xp[skill] || 0)
  p.xp[skill] = (p.xp[skill] || 0) + baseXp
  saveProgress(p)
  const after = getLevel(p.xp[skill])
  checkAchievements(source)
  syncGoals()
  return { xp: baseXp, skill, levelUp: after > before, newLevel: after }
}

export function recordActivity(type) {
  const today = getToday()
  const log = getItem('activityLog', {})
  if (!log[today]) log[today] = []
  if (!log[today].includes(type)) log[today].push(type)
  setItem('activityLog', log)

  const p = getProgress()
  const week = getWeekNumber()
  if (p.weekly.week !== week) p.weekly = { week, done: 0, target: 5, rewarded: false }
  let activeDays = 0
  for (let i = 0; i < 7; i++) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const dateStr = toDateStr(d)
    if (log[dateStr]?.length) activeDays++
  }
  p.weekly.done = activeDays
  if (p.weekly.done >= p.weekly.target && !p.weekly.rewarded) {
    p.weekly.rewarded = true
    addXp('discipline', 200, 'weekly')
  }
  saveProgress(p)
}

function getShieldMonthKey() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function hasStreakShieldUnlocked() {
  return getTotalLevel() >= 15
}

export function getStreakShieldStatus() {
  const p = getProgress()
  const month = getShieldMonthKey()
  const used = p.streakShield?.month === month && p.streakShield?.used
  return {
    unlocked: hasStreakShieldUnlocked(),
    available: hasStreakShieldUnlocked() && !used,
    used,
    month,
    savedDate: p.streakShield?.savedDate || null,
  }
}

export function getStreak() {
  const log = getItem('activityLog', {})
  const p = getProgress()
  const monthKey = getShieldMonthKey()
  const shieldAlreadyUsed = p.streakShield?.month === monthKey && p.streakShield?.used
  let canSkip = hasStreakShieldUnlocked() && !shieldAlreadyUsed

  let streak = 0
  const d = new Date()
  const today = getToday()
  if (!log[today]?.length) d.setDate(d.getDate() - 1)

  for (let i = 0; i < 365; i++) {
    const dateStr = toDateStr(d)
    if (log[dateStr]?.length) {
      streak++
      d.setDate(d.getDate() - 1)
    } else if (canSkip) {
      canSkip = false
      if (!shieldAlreadyUsed) {
        p.streakShield = { month: monthKey, used: true, savedDate: dateStr }
        saveProgress(p)
      }
      d.setDate(d.getDate() - 1)
    } else break
  }
  return streak
}

export const MOODS = [
  { id: 1, emoji: '😔', label: 'Bajo' },
  { id: 2, emoji: '😐', label: 'Neutral' },
  { id: 3, emoji: '🙂', label: 'Bien' },
  { id: 4, emoji: '😊', label: 'Genial' },
]

export function getMood(date = getToday()) {
  const v = getItem(`mood_${date}`, null)
  return v ? MOODS.find(m => m.id === v) || null : null
}

export function setMood(moodId, date = getToday()) {
  setItem(`mood_${date}`, moodId)
  recordActivity('mood')
  return MOODS.find(m => m.id === moodId)
}

export function getMoodWeek() {
  const labels = ['D', 'L', 'M', 'X', 'J', 'V', 'S']
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    const dateStr = toDateStr(d)
    const mood = getMood(dateStr)
    return { label: labels[d.getDay()], date: dateStr, mood, isToday: i === 6 }
  })
}

export function getMoodInsight() {
  const week = getMoodWeek().filter(d => d.mood)
  if (week.length < 3) return 'Registra tu ánimo 3 días para ver patrones — el diario se vuelve más útil con datos.'
  const avg = week.reduce((s, d) => s + d.mood.id, 0) / week.length
  const lows = week.filter(d => d.mood.id <= 2).length
  const highs = week.filter(d => d.mood.id >= 4).length
  if (avg >= 3.5) {
    return highs >= 3
      ? 'Semana luminosa. Canaliza esa energía en una meta concreta antes de que se disperse en mil tareas.'
      : 'Ánimo positivo sostenido. Buen momento para subir dificultad en laboratorio o reflexión experta.'
  }
  if (avg >= 2.5) {
    return lows >= 2
      ? 'Ánimo mixto: días duros alternados con buenos. Las rutinas cortas en días bajos son las que salvan la racha.'
      : 'Ritmo estable. Una reflexión de nivel medio puede revelar qué necesitas ajustar sin drama.'
  }
  if (lows >= 4) return 'Semana pesada. No exijas perfección — una rutina express y 5 min de calma son victoria suficiente.'
  return 'Semana exigente. Prioriza sueño, calma y hábitos mínimos. Volver mañana es el único plan que importa.'
}

export function getStats() {
  return getItem('stats', {
    brainSessions: 0, meditationMinutes: 0, reflections: 0,
    habitsCompleted: 0, routinesCompleted: 0, challengesWon: 0,
  })
}

export function updateStats(updates) {
  const merged = { ...getStats(), ...updates }
  setItem('stats', merged)
  return merged
}

export function getSettings() {
  return getItem('settings', {
    darkMode: false, sound: true, reminderHour: 20, notificationsEnabled: false,
    habitRemindersEnabled: false, habitReminderHour: 18,
    sunsetRemindersEnabled: true,
    defaultDifficulty: 'medio', onboardingComplete: false, userName: '',
    theme: 'default', country: 'MX', compactSidebar: false, reducedMotion: false, tourComplete: false,
    autoBackupEnabled: false, lastAutoBackup: null,
    latitude: null, longitude: null, locationName: '', locationAsked: false,
    medAmbient: 'rain', medAmbientVolume: 0.45,
  })
}

export function needsOnboarding() {
  if (getSettings().onboardingComplete) return false
  const stats = getStats()
  if (stats.routinesCompleted > 0 || stats.brainSessions > 0 || stats.habitsCompleted > 0) return false
  return true
}

export function saveSettings(s) {
  setItem('settings', s)
  document.documentElement.classList.toggle('dark', s.darkMode)
  document.documentElement.classList.toggle('reduce-motion', !!s.reducedMotion)
}

const DEFAULT_HABITS = [
  { id: 'water', name: 'Hidratación', icon: '💧', category: 'salud', difficulty: 1, xp: 15, type: 'counter', target: 8, unit: 'vasos' },
  { id: 'read', name: 'Lectura', icon: '📚', category: 'mente', difficulty: 2, xp: 25, type: 'counter', target: 20, unit: 'min' },
  { id: 'exercise', name: 'Ejercicio físico', icon: '🏃', category: 'salud', difficulty: 3, xp: 35, type: 'check', target: 1, unit: 'sesión' },
  { id: 'journal', name: 'Diario personal', icon: '📝', category: 'sabiduria', difficulty: 2, xp: 30, type: 'check', target: 1, unit: 'entrada' },
  { id: 'learn', name: 'Aprender algo nuevo', icon: '🎓', category: 'mente', difficulty: 3, xp: 40, type: 'check', target: 1, unit: 'vez' },
]

export function getHabits() {
  const habits = getItem('habits', DEFAULT_HABITS)
  return habits.map(h => ({
    ...h,
    category: h.category || 'productividad',
    difficulty: h.difficulty || 2,
    xp: h.xp || 20,
    type: h.type || 'check',
    target: h.target || 1,
    unit: h.unit || 'vez',
  }))
}

export function getHabitCounts(date = getToday()) {
  return getItem(`habit_counts_${date}`, {})
}

export function getHabitCount(habitId, date = getToday()) {
  return getHabitCounts(date)[habitId] || 0
}

export function isHabitComplete(habit, date = getToday()) {
  if (habit.type === 'counter') return getHabitCount(habit.id, date) >= habit.target
  return getItem(`habits_${date}`, []).includes(habit.id)
}

export function getCompletedHabitsCount(date = getToday()) {
  return getHabits().filter(h => isHabitComplete(h, date)).length
}

export function getHabitProgress(habitId) {
  const p = getProgress()
  if (!p.habitData[habitId]) p.habitData[habitId] = { xp: 0, streak: 0, bestStreak: 0, total: 0 }
  return p.habitData[habitId]
}

function markHabitComplete(habit) {
  const today = getToday()
  const completed = getItem(`habits_${today}`, [])
  if (completed.includes(habit.id)) return null

  setItem(`habits_${today}`, [...completed, habit.id])
  recordActivity('habit')

  const p = getProgress()
  const hd = getHabitProgress(habit.id)
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const yStr = toDateStr(yesterday)
  const doneYesterday = isHabitComplete(habit, yStr)
  hd.streak = doneYesterday ? hd.streak + 1 : 1
  hd.bestStreak = Math.max(hd.bestStreak, hd.streak)
  hd.total++
  const bonus = Math.floor(habit.difficulty * 10 * (1 + hd.streak * 0.1))
  hd.xp += bonus
  p.habitData[habit.id] = hd
  saveProgress(p)

  updateStats({ habitsCompleted: getStats().habitsCompleted + 1 })
  checkAchievements('habit')
  syncGoals()
  return { success: true, xp: habit.xp + bonus, name: habit.name, completed: true }
}

export function incrementHabit(habit) {
  const today = getToday()
  if (habit.type === 'check') return markHabitComplete(habit)

  const counts = getHabitCounts(today)
  const current = Math.min((counts[habit.id] || 0) + 1, habit.target + 5)
  counts[habit.id] = current
  setItem(`habit_counts_${today}`, counts)

  const completed = getItem(`habits_${today}`, [])
  if (current >= habit.target && !completed.includes(habit.id)) {
    return markHabitComplete(habit)
  }
  return { success: true, partial: true, count: current, target: habit.target, name: habit.name }
}

export function decrementHabit(habit) {
  const today = getToday()
  const counts = getHabitCounts(today)
  const current = Math.max(0, (counts[habit.id] || 0) - 1)
  counts[habit.id] = current
  setItem(`habit_counts_${today}`, counts)

  if (current < habit.target) {
    const completed = getItem(`habits_${today}`, [])
    if (completed.includes(habit.id)) {
      setItem(`habits_${today}`, completed.filter(id => id !== habit.id))
    }
  }
  return { count: current, target: habit.target }
}

export function completeHabit(habit) {
  return incrementHabit(habit)
}

export function uncompleteHabit(habitId) {
  const today = getToday()
  const completed = getItem(`habits_${today}`, [])
  setItem(`habits_${today}`, completed.filter(id => id !== habitId))
  const counts = getHabitCounts(today)
  delete counts[habitId]
  setItem(`habit_counts_${today}`, counts)
}

export function setRecord(game, difficulty, score) {
  const p = getProgress()
  const key = `${game}_${difficulty}`
  const prev = p.records[key] || { best: 0, plays: 0 }
  p.records[key] = { best: Math.max(prev.best, score), plays: prev.plays + 1, last: getToday() }
  saveProgress(p)
}

export function getRecord(game, difficulty) {
  return getProgress().records[`${game}_${difficulty}`] || { best: 0, plays: 0 }
}

const ACHIEVEMENTS = [
  { id: 'first_routine', name: 'Primer paso', desc: 'Completa tu primera rutina', icon: '🌱', check: () => getStats().routinesCompleted >= 1 },
  { id: 'streak_7', name: 'Semana fuerte', desc: 'Racha de 7 días', icon: '🔥', check: () => getStreak() >= 7 },
  { id: 'streak_30', name: 'Imparable', desc: 'Racha de 30 días', icon: '💪', check: () => getStreak() >= 30 },
  { id: 'brain_10', name: 'Cerebro entrenado', desc: '10 sesiones de laboratorio', icon: '🧠', check: () => getStats().brainSessions >= 10 },
  { id: 'meditate_60', name: 'Zen', desc: '60 minutos meditados', icon: '🧘', check: () => getStats().meditationMinutes >= 60 },
  { id: 'habits_50', name: 'Disciplinado', desc: '50 hábitos completados', icon: '✅', check: () => getStats().habitsCompleted >= 50 },
  { id: 'level_10', name: 'Experiencia', desc: 'Nivel total 10', icon: '⭐', check: () => getTotalLevel() >= 10 },
  { id: 'level_25', name: 'Veterano', desc: 'Nivel total 25', icon: '🏆', check: () => getTotalLevel() >= 25 },
  { id: 'expert_win', name: 'Sin miedo', desc: 'Gana un juego en modo Experto', icon: '💎', check: () => Object.keys(getProgress().records).some(k => k.endsWith('_experto') && getProgress().records[k].best > 0) },
  { id: 'daily_all', name: 'Día perfecto', desc: 'Completa tu plan del día', icon: '🎯', check: () => getPlanProgress().allDone },
  { id: 'goal_first', name: 'Con visión', desc: 'Completa tu primera meta', icon: '🎯', check: () => getGoals().some(g => g.completed) },
  { id: 'reflections_20', name: 'Introspectivo', desc: '20 reflexiones escritas', icon: '📖', check: () => getStats().reflections >= 20 },
  { id: 'challenge_10', name: 'Retador', desc: '10 desafíos completados', icon: '⚔️', check: () => getStats().challengesWon >= 10 },
]

export function checkAchievements(source = '') {
  const p = getProgress()
  const newOnes = []
  for (const a of ACHIEVEMENTS) {
    if (!p.achievements.includes(a.id) && a.check()) {
      p.achievements.push(a.id)
      newOnes.push(a)
    }
  }
  if (newOnes.length) saveProgress(p)
  return newOnes
}

export function getAchievements() {
  return ACHIEVEMENTS.map(a => ({ ...a, unlocked: getProgress().achievements.includes(a.id) }))
}

export function getWeekNumber() {
  const d = new Date()
  const start = new Date(d.getFullYear(), 0, 1)
  return Math.ceil(((d - start) / 86400000 + start.getDay() + 1) / 7)
}

const PLAN_CORE = [
  { id: 'routine', type: 'routine', label: 'Completar rutina diaria', icon: '⚔️', xp: 50, link: '#/rutina' },
  { id: 'habits2', type: 'habits', label: 'Completar 2 hábitos', icon: '✅', xp: 35, target: 2, link: '#/mejora' },
]

const PLAN_ROTATING = [
  { id: 'mental', type: 'brain', label: 'Ejercicio mental', icon: '🧠', xp: 40, link: '#/gimnasia' },
  { id: 'reflect', type: 'reflection', label: 'Escribir una reflexión', icon: '📝', xp: 30, link: '#/mejora/diario' },
  { id: 'meditate', type: 'meditation', label: 'Sesión de calma', icon: '🧘', xp: 35, link: '#/meditacion' },
  { id: 'focus', type: 'focus', label: 'Bloque de enfoque', icon: '⏱️', xp: 30, link: '#/enfoque' },
  { id: 'habits3', type: 'habits', label: 'Completar 3 hábitos', icon: '✅', xp: 45, target: 3, link: '#/mejora' },
  { id: 'express', type: 'express', label: 'Rutina express', icon: '⚡', xp: 35, link: '#/rutina' },
  { id: 'plan_review', type: 'plan_review', label: 'Revisar tu plan', icon: '📋', xp: 20, link: '#/plan' },
]

function buildDailyTasks(dateStr) {
  const d = new Date(dateStr + 'T12:00:00')
  const day = Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 86400000)
  const hour = new Date().getHours()
  const pool = [...PLAN_ROTATING]
  if (hour < 12) {
    pool.unshift({ id: 'morning', type: 'morning', label: 'Abrir el plan de hoy', icon: '🌅', xp: 15, link: '#/plan' })
  } else if (hour >= 18) {
    pool.unshift({ id: 'evening', type: 'evening', label: 'Cerrar el día con diario', icon: '🌙', xp: 25, link: '#/mejora/diario' })
  }
  const pick = []
  for (let i = 0; pick.length < 2; i++) {
    const t = pool[(day + i * 3) % pool.length]
    if (!pick.find(p => p.id === t.id)) pick.push(t)
  }
  return [...PLAN_CORE, ...pick].map(t => enrichMission({ ...t, done: false }))
}

export function ensureDailyPlan() {
  const p = getProgress()
  const today = getToday()
  if (p.plan?.date === today && p.plan?.version === 3) return p.plan

  p.plan = {
    date: today,
    version: 3,
    tasks: buildDailyTasks(today),
    bonusXp: 80,
    bonusClaimed: false,
  }
  saveProgress(p)
  return p.plan
}

export function getPlanProgress() {
  const plan = ensureDailyPlan()
  const done = plan.tasks.filter(t => t.done).length
  const total = plan.tasks.length
  return { done, total, percent: Math.round((done / total) * 100), allDone: done === total }
}

export function checkPlanTask(type) {
  const p = getProgress()
  const plan = ensureDailyPlan()
  const today = getToday()
  const habitsToday = getItem(`habits_${today}`, []).length
  let awarded = []

  for (const task of plan.tasks) {
    if (task.done) continue
    let complete = false
    if (task.type === type) complete = true
    if (task.type === 'habits' && type === 'habit' && getCompletedHabitsCount(today) >= (task.target || 2)) complete = true
    if (task.type === 'routine' && type === 'express') complete = true
    if (task.type === 'express' && type === 'express') complete = true
    if (task.type === 'meditation' && type === 'meditation') complete = true
    if (task.type === 'focus' && type === 'focus') complete = true
    if (task.type === 'morning' && type === 'morning') complete = true
    if (task.type === 'evening' && type === 'evening') complete = true
    if (task.type === 'plan_review' && type === 'plan_review') complete = true

    if (complete) {
      task.done = true
      const result = addXp('discipline', task.xp, 'plan')
      awarded.push({ task, result })
      updateStats({ challengesWon: getStats().challengesWon + 1 })
    }
  }

  const allDone = plan.tasks.every(t => t.done)
  if (allDone && !plan.bonusClaimed) {
    plan.bonusClaimed = true
    const bonus = addXp('discipline', plan.bonusXp, 'plan_bonus')
    awarded.push({ bonus: true, result: bonus })
  }

  p.plan = plan
  saveProgress(p)
  checkAchievements('daily')
  return awarded
}

export const GOAL_TEMPLATES = [
  { title: 'Racha de 30 días', metric: 'streak', target: 30, skill: 'discipline', icon: '🔥', days: 30, pitch: 'La identidad de alguien que vuelve, día tras día.' },
  { title: '30 rutinas completadas', metric: 'routines', target: 30, skill: 'discipline', icon: '⚔️', days: 30, pitch: '30 mañanas donde elegiste entrenarte antes del ruido.' },
  { title: '100 ejercicios mentales', metric: 'brain', target: 100, skill: 'mental', icon: '🧠', days: 90, pitch: 'Cerebro más ágil, atención más estable — medible en semanas.' },
  { title: '60 minutos meditados', metric: 'meditation', target: 60, skill: 'mindfulness', icon: '🧘', days: 30, pitch: 'Una hora de calma acumulada cambia cómo reaccionas bajo presión.' },
  { title: '50 reflexiones escritas', metric: 'reflections', target: 50, skill: 'wisdom', icon: '📝', days: 60, pitch: 'Un archivo de quién eras mientras cambiabas.' },
  { title: '100 hábitos completados', metric: 'habits', target: 100, skill: 'discipline', icon: '✅', days: 60, pitch: 'Sistema sobre motivación — cien pruebas de que funciona.' },
]

export function getGoals() {
  return getItem('goals', [])
}

export function addGoal(template) {
  const goals = getGoals()
  if (goals.filter(g => g.active).length >= 3) return false
  const start = getToday()
  const end = new Date()
  end.setDate(end.getDate() + (template.days || 30))
  goals.push({
    id: 'goal_' + Date.now(),
    title: template.title,
    icon: template.icon,
    metric: template.metric,
    target: template.target,
    skill: template.skill,
    startDate: start,
    endDate: toDateStr(end),
    active: true,
    completed: false,
    progress: 0,
    milestonesHit: [],
  })
  setItem('goals', goals)
  return true
}

export function getGoalProgress(goal) {
  const stats = getStats()
  const map = {
    streak: getStreak(),
    routines: stats.routinesCompleted,
    brain: stats.brainSessions,
    meditation: stats.meditationMinutes,
    reflections: stats.reflections,
    habits: stats.habitsCompleted,
  }
  return map[goal.metric] || 0
}

export function syncGoals() {
  const goals = getGoals()
  const today = getToday()
  let changed = false
  const xpRewards = []

  const GOAL_MILESTONES = [25, 50, 75]
  for (const goal of goals) {
    if (!goal.active || goal.completed) continue
    goal.progress = getGoalProgress(goal)
    if (!goal.milestonesHit) goal.milestonesHit = []
    const pct = goal.target ? Math.min(100, Math.round((goal.progress / goal.target) * 100)) : 0
    for (const m of GOAL_MILESTONES) {
      if (pct >= m && !goal.milestonesHit.includes(m)) {
        goal.milestonesHit.push(m)
        xpRewards.push({ skill: goal.skill, xp: Math.floor(m / 2), source: 'goal_milestone' })
        changed = true
      }
    }
    if (goal.progress >= goal.target) {
      goal.completed = true
      goal.active = false
      goal.completedDate = today
      xpRewards.push({ skill: goal.skill, xp: 150, source: 'goal' })
      changed = true
    }
    if (today > goal.endDate && !goal.completed) {
      goal.active = false
      goal.failed = true
      changed = true
    }
  }
  if (changed) setItem('goals', goals)
  for (const { skill, xp, source } of xpRewards) addXp(skill, xp, source)
  return goals
}

export function getHabitWeekChart() {
  const habits = getHabits()
  const labels = ['D', 'L', 'M', 'X', 'J', 'V', 'S']
  const days = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const dateStr = toDateStr(d)
    const count = habits.filter(h => isHabitComplete(h, dateStr)).length
    const total = habits.length
    days.push({
      label: labels[d.getDay()],
      date: dateStr,
      isToday: i === 0,
      count,
      total,
      percent: total ? Math.round((count / total) * 100) : 0,
    })
  }
  const avg = days.length ? Math.round(days.reduce((s, d) => s + d.percent, 0) / days.length) : 0
  const prevAvg = days.length > 1
    ? Math.round(days.slice(0, 3).reduce((s, d) => s + d.percent, 0) / 3)
    : 0
  const recentAvg = days.length > 1
    ? Math.round(days.slice(-3).reduce((s, d) => s + d.percent, 0) / 3)
    : avg
  return { days, habits, avg, trend: recentAvg - prevAvg }
}

export function isRoutineDoneToday() {
  return getItem('activityLog', {})[getToday()]?.includes('routine')
}
