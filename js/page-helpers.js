/** Helpers de UI compartidos entre páginas */

import {
  SKILLS, DIFFICULTIES, getToday, getProgress, getLevelInfo, getTotalLevel, getRank,
  MOODS, getMood, getMoodWeek, getMoodInsight, getHabitWeekChart,
} from './core.js'
import { isUnlocked } from './unlocks.js'
import { getActivityCalendar } from './analytics.js'
import { segmentBar } from './ui.js'

export function moodPickerHTML(compact = false) {
  const today = getToday()
  const current = getMood(today)
  const week = getMoodWeek()
  const insight = getMoodInsight()
  const picker = `<div class="mood-picker flex gap-2 ${compact === 'home' ? 'mood-picker--home' : 'justify-between'}">
      ${MOODS.map(m => `<button onclick="pickMood(${m.id})" class="mood-btn ${current?.id === m.id ? 'active' : ''}" title="${m.label}">
        <span class="mood-emoji">${m.emoji}</span>
        <span class="mood-label">${m.label}</span>
      </button>`).join('')}
    </div>`

  if (compact === 'home') {
    return `<div class="home-glass home-mood-panel">
      <p class="home-mood-label">Ánimo de hoy</p>
      ${picker}
    </div>`
  }

  return `<div class="card mood-card ${compact ? 'mb-4' : 'mb-6'}">
    <div class="flex justify-between items-center mb-3">
      <h3 class="font-semibold text-main ${compact ? 'text-sm' : ''}">${compact ? '¿Cómo te sientes?' : 'Estado de ánimo'}</h3>
      ${current ? `<span class="text-sm text-muted">${current.emoji} ${current.label}</span>` : '<span class="text-xs text-muted">Sin registrar</span>'}
    </div>
    ${picker}
    ${!compact ? `<div class="mood-week flex justify-between mt-4 pt-4" style="border-top:1px solid var(--border)">
      ${week.map(d => `<div class="text-center flex-1">
        <span class="text-lg">${d.mood?.emoji || '·'}</span>
        <p class="text-xs text-muted mt-1 ${d.isToday ? 'font-bold text-main' : ''}">${d.label}</p>
      </div>`).join('')}
    </div>
    ${insight ? `<p class="text-xs text-muted mt-3 italic">${insight}</p>` : ''}` : ''}
  </div>`
}

export function habitChartHTML(compact = false, home = false) {
  const chart = getHabitWeekChart()
  const maxH = compact ? 80 : 120
  const wrapClass = home ? 'home-glass home-panel' : (compact ? '' : 'card card-static home-panel')
  return `<div class="${wrapClass}">
    <div class="flex justify-between items-center mb-4">
      <h3 class="home-panel-title" style="margin:0">${compact ? 'Hábitos esta semana' : 'Hábitos esta semana'}</h3>
      <span class="text-sm text-muted">Promedio: ${chart.avg}%</span>
    </div>
    <div class="habit-chart flex items-end justify-between gap-2" style="height:${maxH}px">
      ${chart.days.map(d => {
        const h = Math.max(4, (d.percent / 100) * maxH)
        return `<div class="flex-1 flex flex-col items-center gap-1 h-full justify-end">
          <span class="text-muted" style="font-size:10px">${d.count}/${d.total}</span>
          <div class="chart-bar w-full rounded-t-lg transition-all ${d.isToday ? 'chart-bar-today' : ''}" style="height:${h}px" title="${d.percent}%"></div>
          <span class="text-xs text-muted ${d.isToday ? 'font-bold text-main' : ''}">${d.label}</span>
        </div>`
      }).join('')}
    </div>
  </div>`
}

export function xpBar(info, color) {
  return `<div class="mb-1 flex justify-between text-xs text-muted"><span>Nivel ${info.level}</span><span>${info.xp} XP</span></div>
    <div class="progress-track w-full" style="height:0.5rem">
      <div class="progress-fill h-full" style="width:${info.percent}%;background:${color === 'var(--primary)' ? 'var(--gradient-hero)' : color}"></div>
    </div>`
}

export function difficultyPicker(current, onchange) {
  return segmentBar(
    Object.entries(DIFFICULTIES).map(([k, d]) => ({
      id: k,
      label: d.label,
      icon: d.icon,
      locked: k === 'experto' && !isUnlocked('diff_expert'),
      lockTitle: 'Desbloquea en nivel 10',
      lockLabel: '(Nv.10)',
    })),
    current,
    onchange,
  )
}

export function guardDifficulty(d) {
  return d === 'experto' && !isUnlocked('diff_expert') ? 'medio' : d
}

export function playerCard() {
  const rank = getRank()
  const total = getTotalLevel()
  const p = getProgress()
  const totalXp = Object.values(p.xp).reduce((a, b) => a + b, 0)
  const info = getLevelInfo(totalXp)
  return `<div class="card mb-6">
    <div class="flex items-center gap-4 mb-4">
      <div class="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl player-avatar">${rank.icon}</div>
      <div class="flex-1">
        <p class="text-sm text-muted">${rank.title} · Nivel ${total}</p>
        <p class="font-display text-xl font-bold text-main">${totalXp} XP total</p>
      </div>
      <a href="#/perfil" class="text-muted no-underline text-sm">Ver perfil →</a>
    </div>
    ${xpBar(info, 'var(--primary)')}
  </div>`
}

export function heatmapHTML(days = 28) {
  const cal = getActivityCalendar(days)
  return `<div class="heatmap-grid">${cal.map(d =>
    `<div class="heatmap-cell ${d.level ? `l${d.level}` : ''} ${d.isToday ? 'today' : ''}" title="${d.date}: ${d.count} actividades"></div>`
  ).join('')}</div>`
}

export function skillBars() {
  const p = getProgress()
  return Object.entries(SKILLS).map(([key, skill]) => {
    const info = getLevelInfo(p.xp[key] || 0)
    return `<div class="mb-4">
      <div class="flex items-center gap-2 mb-1"><span>${skill.icon}</span><span class="text-sm font-medium text-main">${skill.name}</span><span class="text-xs text-muted ml-auto">Nv. ${info.level}</span></div>
      ${xpBar(info, skill.color)}
    </div>`
  }).join('')
}
