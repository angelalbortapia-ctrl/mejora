/** Plan del día y vista Solo hoy */

import {
  esc, getProgress, saveProgress, getPlanProgress, checkPlanTask, ensureDailyPlan,
  getWeekNumber, isRoutineDoneToday, getHabits, isHabitComplete, getSettings,
} from '../core.js'
import { processPlanAwards } from '../awards.js'
import { sunsetBannerHTML, bundleStatusHTML } from '../apis.js'
import { getNextBestAction } from '../analytics.js'
import { getMissionTone, getMissionChip } from '../coaching.js'
import { pageHero } from '../ui.js'
import { habitChartHTML } from '../page-helpers.js'

export function renderPlan(dailyApis) {
  processPlanAwards(checkPlanTask('plan_review'))
  processPlanAwards(checkPlanTask('morning'))
  const plan = ensureDailyPlan()
  const progress = getPlanProgress()
  const p = getProgress()
  const week = getWeekNumber()
  if (p.weekly.week !== week) { p.weekly = { week, done: 0, target: 5, rewarded: false }; saveProgress(p) }
  const weeklyPct = Math.min(100, (p.weekly.done / p.weekly.target) * 100)

  const holidayMsg = dailyApis?.holiday?.isHoliday
    ? `🎉 Hoy es ${esc(dailyApis.holiday.name)} — prioriza lo esencial`
    : 'Tu hoja de ruta para hoy'

  const statusBadge = bundleStatusHTML(dailyApis)

  return `<div class="animate-fade-in page-shell page-plan">
    <div class="ds-page ds-page--full">
    ${pageHero('Plan del día', `${holidayMsg}${statusBadge ? ` · ${statusBadge}` : ''}`, `${progress.done}/${progress.total}`, 'pendientes')}

    <div class="plan-dashboard">
    <div class="ds-panel ds-panel--flat plan-progress">
      <div class="flex justify-between items-center mb-2">
        <span class="text-sm font-medium text-main">${progress.done}/${progress.total} misiones</span>
        <span class="text-sm text-muted">${progress.percent}%</span>
      </div>
      <div class="progress-track w-full mb-2" style="height:0.75rem">
        <div class="progress-fill h-full" style="width:${progress.percent}%"></div>
      </div>
      ${progress.allDone
        ? `<p class="text-center text-main font-medium">🎉 ¡Plan completo! +${plan.bonusXp} XP bonus</p>`
        : `<p class="text-center text-sm text-muted">Completa todo para +${plan.bonusXp} XP extra</p>`}
    </div>

    <div class="plan-missions ds-list">
      ${plan.tasks.map(t => {
        const tone = getMissionTone(t)
        return `
        <a href="${t.link}" class="ds-list-item plan-mission-item mission--${tone} ${t.done ? 'is-done' : ''} no-underline">
          <span class="ds-list-icon">${t.done ? '✅' : t.icon}</span>
          <div class="ds-list-body">
            <span class="mission-chip">${getMissionChip(tone)}</span>
            <p class="ds-list-title">${t.label}</p>
            ${t.brief ? `<p class="plan-mission-brief">${t.brief}</p>` : ''}
            <p class="ds-list-meta">${t.why || `+${t.xp} XP`}</p>
          </div>
          <span class="mission-xp">+${t.xp}</span>
          ${!t.done ? '<span class="text-muted">→</span>' : ''}
        </a>`
      }).join('')}
    </div>

    <div class="plan-side">
      ${!isRoutineDoneToday() ? `<div class="card plan-express" style="border:2px dashed var(--border)">
        <h3 class="font-semibold text-main mb-2">⏱️ Modo Express (5 min)</h3>
        <p class="text-sm text-muted mb-4">¿Poco tiempo? Rutina corta: 1 min respiración + 3 cálculos.</p>
        <button onclick="startExpress()" class="btn-secondary w-full">Iniciar express</button>
      </div>` : ''}

      <div class="card plan-weekly">
        <h3 class="font-semibold text-main mb-2">📅 Misión semanal</h3>
        <p class="text-sm text-muted mb-3">Activo ${p.weekly.target} días esta semana → +200 XP</p>
        <div class="w-full h-2 rounded-full" style="background:var(--secondary-bg)">
          <div class="h-2 rounded-full" style="width:${weeklyPct}%;background:var(--primary)"></div>
        </div>
        <p class="text-xs text-muted mt-2">${p.weekly.done}/${p.weekly.target} días</p>
      </div>

      ${sunsetBannerHTML(dailyApis?.sun)}
    </div>

    <div class="plan-chart">${habitChartHTML()}</div>
    </div>
    </div>
  </div>`
}

export function renderSoloHoy() {
  const progress = getPlanProgress()
  const action = getNextBestAction()
  const habits = getHabits().filter(h => !isHabitComplete(h)).slice(0, 3)

  return `<div class="animate-fade-in route-enter page-shell page-wide page-solo-hoy">
    <a href="#/" class="btn-secondary focus-exit no-underline">← Salir</a>
    <div class="ds-page ds-page--full solo-dashboard">
    ${pageHero('Solo hoy', 'Una cosa a la vez, sin ruido', `${progress.percent}%`, 'plan del día')}
    <div class="ds-panel ds-panel--flat text-center solo-focus">
      <p class="text-xs text-muted uppercase tracking-wide mb-2">Modo enfoque</p>
      <p class="font-display text-3xl font-bold text-main">${progress.percent}%</p>
      <p class="text-sm text-muted">Plan del día · ${progress.done}/${progress.total}</p>
      <div class="progress-track w-full mt-3" style="height:8px">
        <div class="progress-fill h-full" style="width:${progress.percent}%"></div>
      </div>
      <div class="grid grid-cols-2 gap-2 mt-4">
        <a href="#/rutina" class="btn-secondary text-center no-underline py-3">⚔️ Express</a>
        <a href="#/" class="btn-ghost text-center no-underline py-3">Vista completa</a>
      </div>
    </div>

    <a href="${action.link}" class="ds-list-item next-action no-underline solo-action">
      <span class="ds-list-icon">${action.icon}</span>
      <div class="ds-list-body">
        <p class="ds-list-meta" style="margin:0">Ahora</p>
        <p class="ds-list-title">${action.title}</p>
        <p class="ds-list-meta">${action.desc}</p>
      </div>
      <span class="text-muted">→</span>
    </a>

    ${habits.length ? `<div class="ds-panel ds-panel--flat solo-habits">
      <h3 class="section-title" style="margin:0 0 0.75rem">Hábitos pendientes</h3>
      <div class="space-y-2">
        ${habits.map(h => `<a href="#/mejora" class="flex items-center gap-2 p-2 rounded-lg no-underline habit-item">
          <span>${h.icon}</span><span class="text-main text-sm flex-1">${esc(h.name)}</span><span class="text-muted text-xs">→</span>
        </a>`).join('')}
      </div>
    </div>` : `<div class="card card-static solo-habits solo-habits--done">
      <p class="text-main font-medium mb-1">✅ Hábitos al día</p>
      <p class="text-sm text-muted">Buen trabajo. Mañana seguimos.</p>
    </div>`}
    </div>
  </div>`
}
