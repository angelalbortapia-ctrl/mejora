/** Mi viaje — resumen, actividad, hitos */

import { getDomainProgress } from '../brain-program.js'
import {
  getJourneySummary, getJourneyInsight, getHabitTrendWeeks,
  getWeeklySummary, getWeeklyActivityScores, getMilestones,
} from '../analytics.js'
import { tabBar, pageHero, sparklineSVG } from '../ui.js'
import { heatmapHTML } from '../page-helpers.js'

let viajeTab = 'resumen'

export function getViajeTab() { return viajeTab }
export function setViajeTab(v) { viajeTab = v }

export function renderViaje() {
  const s = getJourneySummary()
  const insight = getJourneyInsight()
  const trends12 = getHabitTrendWeeks(12)
  const activity12 = getWeeklyActivityScores(12)
  const weekly = getWeeklySummary()
  const milestones = getMilestones()
  const domains = getDomainProgress()
  const max12 = Math.max(...trends12.map(t => t.percent), 1)

  const since = new Date(s.firstActivity + 'T12:00:00').toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' })
  const viajeTabs = tabBar([
    { id: 'resumen', label: 'Resumen', icon: '📊' },
    { id: 'actividad', label: 'Actividad', icon: '📈' },
    { id: 'hitos', label: 'Hitos', icon: '🏆' },
  ], viajeTab, 'viajeTab')

  const resumenBlock = `
    <div class="viaje-kpi-grid">
      <div class="viaje-kpi"><span class="viaje-kpi-val">${s.streak}</span><span class="viaje-kpi-label">🔥 Racha</span></div>
      <div class="viaje-kpi"><span class="viaje-kpi-val">${s.consistency30}%</span><span class="viaje-kpi-label">Consistencia</span></div>
      <div class="viaje-kpi"><span class="viaje-kpi-val">${s.habitsCompleted}</span><span class="viaje-kpi-label">Hábitos</span></div>
      <div class="viaje-kpi"><span class="viaje-kpi-val">${s.brainSessions}</span><span class="viaje-kpi-label">Sesiones mente</span></div>
    </div>
    <div class="card card-static weekly-summary-card viaje-weekly">
      <h3 class="section-title">Resumen semanal</h3>
      <p class="text-sm text-main leading-relaxed mb-3">${weekly.narrative}</p>
      <div class="weekly-summary-stats">
        <span class="weekly-pill">${weekly.activeDays}/7 días activos</span>
        <span class="weekly-pill">${weekly.habitDays} días con hábitos</span>
        ${weekly.moodAvg ? `<span class="weekly-pill">Ánimo ${weekly.moodAvg}/4</span>` : ''}
      </div>
    </div>

    <div class="viaje-side">
      <div class="card card-static text-center py-6 viaje-consistency">
        <div class="consistency-ring" style="--pct:${s.consistency30}">
          <span>${s.consistency30}%</span>
          <small>consistencia</small>
        </div>
        <p class="text-sm text-muted mt-4">${s.activeDays30} de 30 días activos</p>
      </div>
      <div class="card card-static viaje-summary">
        <h3 class="font-semibold text-main mb-3">Resumen total</h3>
        <div class="space-y-2 text-sm">
          <div class="flex justify-between"><span class="text-muted">🔥 Racha actual</span><span class="text-main font-medium">${s.streak} días</span></div>
          <div class="flex justify-between"><span class="text-muted">🧠 Sesiones cerebrales</span><span class="text-main font-medium">${s.brainSessions}</span></div>
          <div class="flex justify-between"><span class="text-muted">✅ Hábitos completados</span><span class="text-main font-medium">${s.habitsCompleted}</span></div>
          <div class="flex justify-between"><span class="text-muted">🎯 Metas logradas</span><span class="text-main font-medium">${s.goalsCompleted}</span></div>
        </div>
      </div>
    </div>

    <div class="card card-static viaje-insight">
      <h3 class="section-title">Insight personalizado</h3>
      <p class="text-sm text-main leading-relaxed">${insight}</p>
    </div>

    <div class="viaje-actions flex gap-2 flex-wrap span-full">
      <button onclick="exportMonthlyReportText()" class="btn-secondary flex-1">📄 Informe mensual</button>
      <a href="#/ajustes" onclick="settingsTab='data';setTimeout(render,0)" class="btn-ghost flex-1 text-center no-underline">Respaldo →</a>
    </div>`

  const actividadBlock = `
    <div class="card card-static viaje-heatmap">
      <h3 class="section-title">Mapa de actividad (35 días)</h3>
      ${heatmapHTML(35)}
    </div>

    <div class="card card-static viaje-trends-habits">
      <h3 class="section-title">Tendencia de hábitos (12 semanas)</h3>
      ${sparklineSVG(trends12.map(t => t.percent))}
      <div class="trend-bars mt-4">
        ${trends12.map((t, i) => `
          <div class="trend-bar-wrap">
            <div class="trend-bar" style="height:${Math.max(4, (t.percent / max12) * 100)}%"></div>
            <span class="trend-bar-label">${i + 1}</span>
          </div>`).join('')}
      </div>
      <p class="text-xs text-muted mt-3 text-center">Promedio semanal · números = semanas</p>
    </div>

    <div class="card card-static viaje-trends-activity">
      <h3 class="section-title">Actividad (12 semanas)</h3>
      ${sparklineSVG(activity12.map(a => a.score), 'var(--cyan)')}
      <p class="text-xs text-muted mt-3 text-center">Total de actividades registradas por semana</p>
    </div>

    <div class="card card-static viaje-domains">
      <h3 class="section-title">Dominios cognitivos</h3>
      <div class="space-y-3">
        ${domains.map(d => `
          <div>
            <div class="flex justify-between text-sm mb-1">
              <span>${d.icon} ${d.name}</span>
              <span class="text-muted">Nv. ${d.level}</span>
            </div>
            <div class="progress-track w-full" style="height:4px">
              <div class="progress-fill h-full" style="width:${d.xp % 100}%;background:${d.color}"></div>
            </div>
          </div>`).join('')}
      </div>
      <a href="#/gimnasia" class="btn-secondary w-full mt-4 block text-center no-underline">Ir a gimnasia →</a>
    </div>`

  const hitosBlock = `
    <div class="viaje-milestones span-full">
      <h3 class="section-title">Hitos del viaje</h3>
      <div class="milestone-grid">
        ${milestones.map(m => `
          <div class="milestone-item ${m.done ? 'done' : ''}">
            <span class="mi-icon">${m.done ? m.icon : '🔒'}</span>
            ${m.label}
          </div>`).join('')}
      </div>
    </div>`

  const tabContent = viajeTab === 'resumen' ? resumenBlock
    : viajeTab === 'actividad' ? actividadBlock
    : hitosBlock

  return `<div class="animate-fade-in page-shell page-viaje route-enter">
    <div class="ds-page ds-page--full">
    ${pageHero('Mi viaje', `Día ${s.daysSinceStart} de tu camino · desde ${since}`, `${s.consistency30}%`, 'consistencia 30d')}
    ${viajeTabs}
    <div class="viaje-dashboard">${tabContent}</div>
    </div>
  </div>`
}
