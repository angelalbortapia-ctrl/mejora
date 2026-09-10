/** Componentes UI reutilizables */
export function icon(name, cls = 'ui-icon') {
  const icons = {
    home: '<path d="M4 10.5L12 4l8 6.5V20a1 1 0 01-1 1h-5v-6H10v6H5a1 1 0 01-1-1v-9.5z"/>',
    plan: '<path d="M6 4h12a1 1 0 011 1v14a1 1 0 01-1 1H6a1 1 0 01-1-1V5a1 1 0 011-1zm2 3h8M8 11h8M8 15h5"/>',
    brain: '<circle cx="12" cy="12" r="3"/><path d="M12 2a7 7 0 017 7c0 2.5-1.2 4.7-3 6.1V18H8v-2.9A7 7 0 0112 2z"/>',
    habit: '<path d="M9 12l2 2 4-4"/><rect x="4" y="4" width="16" height="16" rx="3"/>',
    goal: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/>',
    chart: '<path d="M4 19V5M8 19V11M12 19V8M16 19V14M20 19V6"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    spark: '<path d="M12 2l1.8 5.5L19 9l-5.2 1.5L12 16l-1.8-5.5L5 9l5.2-1.5L12 2z"/>',
    shield: '<path d="M12 3l8 4v5c0 5-3.5 8.5-8 9-4.5-.5-8-4-8-9V7l8-4z"/>',
    zap: '<path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z"/>',
  }
  const body = icons[name] || icons.spark
  return `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`
}

export function skeletonCard(lines = 3) {
  return `<div class="skeleton-card" aria-busy="true" aria-label="Cargando">
    <div class="skeleton-line skeleton-line-title"></div>
    ${Array.from({ length: lines }, () => '<div class="skeleton-line"></div>').join('')}
    <div class="skeleton-line skeleton-line-short"></div>
  </div>`
}

export function emptyState({ icon: emoji = '✦', title, desc, ctaLabel, ctaHref, ctaOnclick }) {
  const action = ctaOnclick
    ? `<button onclick="${ctaOnclick}" class="btn-primary">${ctaLabel}</button>`
    : ctaHref
      ? `<a href="${ctaHref}" class="btn-primary no-underline">${ctaLabel}</a>`
      : ''
  return `<div class="empty-state">
    <span class="empty-state-icon">${emoji}</span>
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
