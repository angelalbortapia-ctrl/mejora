/** Página Hábitos (Mejora) */

import {
  esc, getToday, getHabits, setItem, getHabitProgress, getLevel, completeHabit, uncompleteHabit,
  incrementHabit, decrementHabit, getHabitCount, isHabitComplete, getCompletedHabitsCount,
  checkPlanTask, setMood, getMood, getStreak,
} from '../core.js'
import { HABIT_CATEGORIES, HABIT_TEMPLATES } from '../content.js'
import { emptyState } from '../ui.js'
import { habitChartHTML } from '../page-helpers.js'
import { awardXp, processPlanAwards } from '../awards.js'
import { forgeSparkAt, pulseElement, haptic } from '../fx.js?v=145'
import { playHabitDone } from '../sounds.js'

let editingHabits = false

export function getEditingHabits() { return editingHabits }
export function setEditingHabits(v) { editingHabits = v }

function renderHabitEditor() {
  const habits = getHabits()
  const existingIds = new Set(habits.map(h => h.id))
  const suggestions = HABIT_TEMPLATES.filter(t => !existingIds.has(t.id) && !existingIds.has(t.id.replace('tpl_', '')))
  return `<div class="m-habit-editor space-y-3">
    ${suggestions.length ? `<div class="mb-4">
      <p class="m-section-meta" style="margin:0 0 0.5rem">Plantillas sugeridas</p>
      <div class="m-habit-templates">
        ${suggestions.slice(0, 12).map(t => {
          const cat = HABIT_CATEGORIES[t.category] || HABIT_CATEGORIES.salud
          return `<button type="button" onclick="addHabitTemplate('${t.id}')" class="m-habit-template" style="--cat:${cat.color}">
            ${t.icon} ${esc(t.name)}
          </button>`
        }).join('')}
      </div>
    </div>` : ''}
    ${habits.map((h, i) => `<div class="m-habit-editor-row">
      <div class="flex gap-2 mb-2">
        <input value="${esc(h.icon)}" onchange="updateHabitField(${i},'icon',this.value)" class="input-field w-14 text-center text-xl">
        <input value="${esc(h.name)}" onchange="updateHabitField(${i},'name',this.value)" class="input-field flex-1">
        <button type="button" onclick="removeHabit(${i})" class="btn-ghost text-red-400">✕</button>
      </div>
      <div class="flex gap-2">
        <select onchange="updateHabitField(${i},'category',this.value)" class="input-field flex-1 text-sm">
          ${Object.entries(HABIT_CATEGORIES).map(([k, c]) => `<option value="${k}" ${h.category === k ? 'selected' : ''}>${c.icon} ${c.name}</option>`).join('')}
        </select>
        <select onchange="updateHabitField(${i},'difficulty',parseInt(this.value))" class="input-field w-24 text-sm">
          ${[1, 2, 3, 4, 5].map(d => `<option value="${d}" ${h.difficulty === d ? 'selected' : ''}>★${d}</option>`).join('')}
        </select>
        <input type="number" value="${h.xp}" onchange="updateHabitField(${i},'xp',parseInt(this.value))" class="input-field w-20 text-sm" title="XP">
      </div>
      <div class="flex gap-2 mt-2">
        <select onchange="updateHabitField(${i},'type',this.value)" class="input-field flex-1 text-sm">
          <option value="check" ${h.type === 'check' ? 'selected' : ''}>✓ Checkbox</option>
          <option value="counter" ${h.type === 'counter' ? 'selected' : ''}>🔢 Contador</option>
        </select>
        <input type="number" min="1" value="${h.target || 1}" onchange="updateHabitField(${i},'target',parseInt(this.value))" class="input-field w-20 text-sm" title="Meta">
        <input value="${esc(h.unit || 'vez')}" onchange="updateHabitField(${i},'unit',this.value)" class="input-field flex-1 text-sm" placeholder="Unidad">
      </div>
    </div>`).join('')}
    <div class="flex gap-2 mt-4">
      <button type="button" onclick="addHabit()" class="btn-secondary flex-1">+ Agregar</button>
      <button type="button" onclick="editingHabits=false;render()" class="btn-primary flex-1">Listo</button>
    </div>
  </div>`
}

function renderHabitsGrid(today) {
  const habits = getHabits()
  if (!habits.length) {
    return emptyState({
      iconKey: 'habit',
      title: 'Sin hábitos activos',
      desc: 'Elige plantillas sugeridas o crea los tuyos para empezar a sumar XP.',
      ctaLabel: 'Agregar hábitos',
      ctaOnclick: 'editingHabits=true;render(true)',
    })
  }
  return `<div class="habits-grid m-habits-grid">
    ${habits.map(h => {
      const hp = getHabitProgress(h.id)
      const hLevel = getLevel(hp.xp)
      const cat = HABIT_CATEGORIES[h.category] || HABIT_CATEGORIES.salud
      const diffStars = '★'.repeat(h.difficulty) + '☆'.repeat(5 - h.difficulty)
      const isDone = isHabitComplete(h, today)
      const count = getHabitCount(h.id, today)
      const isCounter = h.type === 'counter'
      const progressPct = isCounter ? Math.min(100, Math.round((count / h.target) * 100)) : (isDone ? 100 : 0)
      const control = isCounter
        ? `<div class="habit-counter ${isDone ? 'done' : ''}" onclick="event.stopPropagation()">
            <button type="button" onclick="adjustHabit('${h.id}',-1)">−</button>
            <span class="count">${count}/${h.target} ${h.unit}</span>
            <button type="button" onclick="adjustHabit('${h.id}',1)">+</button>
          </div>`
        : `<button type="button" onclick="toggleHabit('${h.id}')" class="habit-check ${isDone ? 'done' : ''}">${isDone ? '✓' : ''}</button>`
      return `<div class="habit-card ${isDone ? 'is-done' : ''}" data-habit-id="${h.id}">
        <div class="habit-card-icon" aria-hidden="true">${h.icon}</div>
        <div class="habit-card-body">
          <div class="habit-card-title-row">
            <span class="habit-card-title ${isDone ? 'is-done' : ''}">${esc(h.name)}</span>
            <span class="habit-card-cat" style="--cat-color:${cat.color}">${cat.icon} ${cat.name}</span>
          </div>
          <div class="habit-card-meta">
            <span>Nv. ${hLevel}</span>
            <span class="habit-card-stars">${diffStars}</span>
            ${hp.streak > 0 ? `<span>🔥 ${hp.streak}</span>` : ''}
            <span>+${h.xp} XP</span>
          </div>
          ${isCounter ? `<div class="habit-card-progress">
            <div class="habit-card-progress-fill" style="width:${progressPct}%"></div>
          </div>` : ''}
        </div>
        <div class="habit-card-action">${control}</div>
      </div>`
    }).join('')}
  </div>`
}

export function renderMejora() {
  const today = getToday()
  const habits = getHabits()
  const doneCount = getCompletedHabitsCount(today)
  const streak = getStreak()
  const mood = getMood(today)

  const body = editingHabits
    ? renderHabitEditor()
    : renderHabitsGrid(today)

  const chart = !editingHabits && habits.length
    ? `<aside class="m-habits-chart">${habitChartHTML()}</aside>`
    : ''

  return `<div class="animate-fade-in page-shell page-wide page-mejora page-mejora--v3">
    <main class="m-page m-page--habits">
      <header class="m-page-header">
        <p class="m-page-kicker">Hábitos</p>
        <h1 class="m-page-title">Ejecuta hoy</h1>
        <p class="m-page-lead">Marca cada hábito al completarlo. Disciplina = XP + racha.</p>
        <p class="m-progress-pill">
          <span>✓ <strong>${doneCount}/${habits.length}</strong> hoy</span>
          <span>· 🔥 <strong>${streak}</strong> días</span>
          ${mood ? `<span>· ${mood.emoji} ${mood.label}</span>` : ''}
        </p>
      </header>

      <div class="m-page-toolbar">
        <h2 class="m-section-title">${editingHabits ? 'Editar hábitos' : 'Lista de hoy'}</h2>
        <button type="button" onclick="editingHabits=${editingHabits ? 'false' : 'true'};render(true)" class="btn-secondary text-sm">
          ${editingHabits ? '← Volver' : '✏️ Editar'}
        </button>
      </div>

      <div class="m-habits-layout-v3">
        ${chart}
        <section class="m-section m-habits-panel">${body}</section>
      </div>
    </main>
  </div>`
}

export function bindMejoraGlobals() {
  const render = () => window.render?.()

  window.updateHabitField = (i, field, val) => { const h = getHabits(); h[i][field] = val; setItem('habits', h) }
  window.removeHabit = (i) => { const h = getHabits(); h.splice(i, 1); setItem('habits', h); render() }
  window.addHabit = () => {
    const h = getHabits()
    h.push({ id: 'custom_' + Date.now(), name: 'Nuevo hábito', icon: '⭐', category: 'productividad', difficulty: 2, xp: 25, type: 'check', target: 1, unit: 'vez' })
    setItem('habits', h)
    render()
  }
  window.addHabitTemplate = (tplId) => {
    const tpl = HABIT_TEMPLATES.find(t => t.id === tplId)
    if (!tpl) return
    const h = getHabits()
    if (h.some(x => x.id === tpl.id || x.name === tpl.name)) return
    h.push({ ...tpl, id: tpl.id.replace('tpl_', '') || tpl.id })
    setItem('habits', h)
    render()
  }
  window.adjustHabit = function(id, delta) {
    const habit = getHabits().find(h => h.id === id)
    if (!habit) return
    if (delta > 0) {
      const result = incrementHabit(habit)
      if (result?.completed) {
        const row = document.querySelector(`[data-habit-id="${id}"]`)
        forgeSparkAt(row?.closest('.habit-card') || row)
        pulseElement(row?.closest('.habit-card') || row)
        awardXp('discipline', result.xp, result.name)
        processPlanAwards(checkPlanTask('habit'))
      }
    } else decrementHabit(habit)
    render()
  }
  window.toggleHabit = function(id) {
    const habit = getHabits().find(h => h.id === id)
    if (!habit || habit.type === 'counter') return
    if (isHabitComplete(habit)) uncompleteHabit(id)
    else {
      const result = completeHabit(habit)
      if (result?.completed) {
        haptic(20)
        playHabitDone()
        const row = document.querySelector(`[data-habit-id="${id}"]`)
        forgeSparkAt(row?.closest('.habit-card') || row)
        pulseElement(row?.closest('.habit-card') || row)
        awardXp('discipline', result.xp, result.name)
        processPlanAwards(checkPlanTask('habit'))
      }
    }
    render()
  }
  window.pickMood = function(id) {
    const wasSet = getMood()
    const mood = setMood(id)
    if (!wasSet) awardXp('wisdom', 10, `Ánimo: ${mood.label}`)
    render()
  }
}
