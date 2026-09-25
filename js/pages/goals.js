/** Metas a 30-90 días */

import { GOAL_TEMPLATES, getGoals, addGoal, syncGoals } from '/js/core.js'
import { showToast } from '/js/awards.js'
import { emptyState, tabBar, pageHero, milestoneBar } from '/js/ui.js'

let metasTab = 'activas'

export function getMetasTab() { return metasTab }
export function setMetasTab(v) { metasTab = v }

export function renderMetas() {
  syncGoals()
  const goals = getGoals()
  const active = goals.filter(g => g.active)
  const completed = goals.filter(g => g.completed)
  const failed = goals.filter(g => g.failed)

  const metasTabs = tabBar([
    { id: 'activas', label: `Activas (${active.length}/3)`, icon: '🎯' },
    { id: 'plantillas', label: 'Nueva', icon: '➕' },
    { id: 'historial', label: 'Historial', icon: '📜' },
  ], metasTab, 'metasTab')

  let tabContent = ''
  if (metasTab === 'activas') {
    tabContent = !active.length ? emptyState({
      iconKey: 'goal',
      title: 'Sin metas activas',
      desc: 'Elige una plantilla en la pestaña Nueva para darle dirección a tu progreso.',
      ctaLabel: 'Ver plantillas',
      ctaOnclick: "metasTab='plantillas';render()",
    }) : `<div class="metas-active-grid">
      ${active.map(g => {
        const daysLeft = Math.max(0, Math.ceil((new Date(g.endDate) - new Date()) / 86400000))
        return `<div class="card">
          <div class="flex items-center gap-3 mb-3">
            <span class="text-2xl">${g.icon}</span>
            <div class="flex-1"><p class="font-medium text-main">${g.title}</p>
            <p class="text-xs text-muted">Hasta ${new Date(g.endDate).toLocaleDateString('es')} · ${daysLeft} días</p></div>
          </div>
          ${milestoneBar(g.progress, g.target, g.milestonesHit || [])}
          <p class="text-sm text-muted mt-2">${g.progress} / ${g.target} · Hitos 25/50/75% · +150 XP al completar</p>
        </div>`
      }).join('')}
    </div>`
  } else if (metasTab === 'plantillas') {
    tabContent = active.length >= 3
      ? '<p class="text-muted text-sm text-center py-8">Máximo 3 metas activas. Completa una para agregar otra.</p>'
      : `<div class="metas-templates-grid">
        ${GOAL_TEMPLATES.map((t, i) => `
          <button onclick="pickGoal(${i})" class="card text-left w-full cursor-pointer goal-template-card">
            <div class="flex items-start gap-3">
              <span class="text-2xl">${t.icon}</span>
              <div class="flex-1">
                <p class="font-medium text-main">${t.title}</p>
                <p class="text-sm text-muted mt-1">${t.pitch || ''}</p>
                <p class="text-xs text-muted mt-2">${t.days} días · Meta: ${t.target} · +150 XP</p>
              </div>
            </div>
          </button>`).join('')}
      </div>`
  } else {
    tabContent = !completed.length && !failed.length
      ? emptyState({
        iconKey: 'journey',
        title: 'Sin historial aún',
        desc: 'Cuando completes o cierres metas, aparecerán aquí.',
      })
      : `${completed.length ? `<p class="ds-section-title">Completadas</p>
        <div class="ds-list mb-6">${completed.map(g => `
          <div class="ds-list-item is-done">
            <span class="ds-list-icon">${g.icon}</span>
            <div class="ds-list-body">
              <p class="ds-list-title">${g.title}</p>
              <p class="ds-list-meta">${g.progress}/${g.target} · +150 XP</p>
            </div>
            <span class="ds-chip ds-chip--accent">🏆</span>
          </div>`).join('')}
        </div>` : ''}
        ${failed.length ? `<p class="ds-section-title">No completadas</p>
        <div class="ds-list">${failed.map(g => `
          <div class="ds-list-item is-done">
            <span class="ds-list-icon">${g.icon}</span>
            <div class="ds-list-body">
              <p class="ds-list-title">${g.title}</p>
              <p class="ds-list-meta">Meta no alcanzada</p>
            </div>
          </div>`).join('')}
        </div>` : ''}`
  }

  return `<div class="animate-fade-in route-enter page-shell page-wide page-metas">
    <div class="ds-page ds-page--full">
      ${pageHero('Metas', 'Objetivos a 30-90 días con hitos en 25%, 50% y 75%', active.length, 'activas')}
      ${metasTabs}
      <div class="ds-panel ds-panel--flat">${tabContent}</div>
    </div>
  </div>`
}

export function bindGoalsGlobals() {
  window.pickGoal = function(index) {
    if (addGoal(GOAL_TEMPLATES[index])) {
      showToast('Meta activada', 0, 'discipline')
      window.render?.()
    }
  }
}
