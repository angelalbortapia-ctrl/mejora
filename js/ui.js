/** Componentes UI reutilizables */

import { icon } from './icons.js'

/** Pestañas horizontales — stateVar: nombre de variable global (ej. mejoraTab) */
export function tabBar(tabs, activeId, stateVar, extraOnClick = '') {
  return `<nav class="ds-tabs" role="tablist">
    ${tabs.map(t => {
      const locked = t.locked
      const active = activeId === t.id
      return `<button type="button" role="tab" aria-selected="${active}"
        class="ds-tab ${active ? 'is-active' : ''} ${locked ? 'ds-tab--locked' : ''}"
        ${locked ? 'disabled title="' + (t.lockTitle || 'Bloqueado') + '"' : `onclick="${stateVar}='${t.id}';${extraOnClick}render(true)"`}>
        ${t.icon ? `<span class="ds-tab-icon" aria-hidden="true">${t.icon}</span>` : ''}
        <span>${t.label}</span>
      </button>`
    }).join('')}
  </nav>`
}

/** Pestañas secundarias (píldoras) */
export function subTabBar(tabs, activeId, stateVar, extraOnClick = '') {
  return `<div class="ds-subtabs" role="tablist">
    ${tabs.map(t => {
      const active = activeId === t.id
      return `<button type="button" role="tab" aria-selected="${active}"
        class="ds-subtab ${active ? 'is-active' : ''}"
        onclick="${stateVar}='${t.id}';${extraOnClick}render(true)">
        ${t.icon ? `${t.icon} ` : ''}${t.label}
      </button>`
    }).join('')}
  </div>`
}

/** Control segmentado (dificultad, filtros) */
export function segmentBar(items, activeId, onchangeFn) {
  return `<div class="ds-segment" role="group">
    ${items.map(item => {
      const locked = item.locked
      const active = activeId === item.id
      return `<button type="button"
        class="ds-segment-btn ${active ? 'is-active' : ''}"
        ${locked ? 'disabled title="' + (item.lockTitle || 'Bloqueado') + '"' : `onclick="${onchangeFn}('${item.id}')"`}>
        ${locked ? '🔒 ' : ''}${item.icon ? `${item.icon} ` : ''}${item.label}${locked && item.lockLabel ? ` ${item.lockLabel}` : ''}
      </button>`
    }).join('')}
  </div>`
}

export function settingRow(label, control, hint = '') {
  return `<div class="ds-setting-row ${hint ? 'ds-setting-row--stack' : ''}">
    <div>
      <span class="ds-setting-label">${label}</span>
      ${hint ? `<p class="ds-setting-hint">${hint}</p>` : ''}
    </div>
    ${hint ? control : `<div class="ds-setting-control">${control}</div>`}
  </div>`
}

export function settingGroup(title, rowsHtml) {
  return `<div class="ds-setting-group">
    ${title ? `<p class="ds-section-title">${title}</p>` : ''}
    ${rowsHtml}
  </div>`
}

export function pageLead(html) {
  return `<p class="ds-lead">${html}</p>`
}

export function pageHero(title, subtitle, statVal = '', statLabel = '') {
  return `<div class="page-hero span-full">
    <div class="page-hero__mesh" aria-hidden="true"></div>
    <div class="page-hero__body">
      <div>
        <h1 class="page-hero__title">${title}</h1>
        ${subtitle ? `<p class="page-hero__sub">${subtitle}</p>` : ''}
      </div>
      ${statVal ? `<div class="page-hero__stat"><span class="page-hero__stat-val">${statVal}</span><span class="page-hero__stat-label">${statLabel}</span></div>` : ''}
    </div>
  </div>`
}

export function zoneHeader(title, subtitle = '') {
  return `<div class="ds-zone">
    <div class="ds-zone-line" aria-hidden="true"></div>
    <div class="ds-zone-text">
      <h2 class="ds-zone-title">${title}</h2>
      ${subtitle ? `<p class="ds-zone-sub">${subtitle}</p>` : ''}
    </div>
    <div class="ds-zone-line" aria-hidden="true"></div>
  </div>`
}

export function skeletonCard(lines = 3) {
  return `<div class="skeleton-card" aria-busy="true" aria-label="Cargando">
    <div class="skeleton-line skeleton-line-title"></div>
    ${Array.from({ length: lines }, () => '<div class="skeleton-line"></div>').join('')}
    <div class="skeleton-line skeleton-line-short"></div>
  </div>`
}

export function emptyState({ icon: emoji = '✦', iconKey, title, desc, ctaLabel, ctaHref, ctaOnclick }) {
  const action = ctaOnclick
    ? `<button onclick="${ctaOnclick}" class="btn-primary">${ctaLabel}</button>`
    : ctaHref
      ? `<a href="${ctaHref}" class="btn-primary no-underline">${ctaLabel}</a>`
      : ''
  const iconHtml = iconKey
    ? `<span class="empty-state-icon empty-state-icon--svg">${icon(iconKey, 'empty-state-svg')}</span>`
    : `<span class="empty-state-icon">${emoji}</span>`
  return `<div class="empty-state empty-state--premium">
    <div class="empty-state-glow" aria-hidden="true"></div>
    ${iconHtml}
    <p class="empty-state-title">${title}</p>
    <p class="empty-state-desc">${desc}</p>
    ${action ? `<div class="empty-state-action">${action}</div>` : ''}
  </div>`
}

export function milestoneBar(progress, target, milestonesHit = []) {
  const pct = Math.min(100, Math.round((progress / target) * 100))
  const marks = [25, 50, 75].map(m => {
    const hit = milestonesHit.includes(m) || pct >= m
    return `<span class="milestone-mark ${hit ? 'hit' : ''}" style="left:${m}%">${m}%</span>`
  }).join('')
  return `<div class="milestone-bar-wrap">
    <div class="milestone-bar">
      <div class="milestone-bar-fill" style="width:${pct}%"></div>
      ${marks}
    </div>
  </div>`
}

export function sparklineSVG(values, color = 'var(--primary)') {
  if (!values.length) return ''
  const max = Math.max(...values, 1)
  const w = 200
  const h = 48
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1 || 1)) * w
    const y = h - (v / max) * (h - 8) - 4
    return `${x},${y}`
  }).join(' ')
  return `<svg class="sparkline" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none">
    <polyline points="${pts}" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`
}
