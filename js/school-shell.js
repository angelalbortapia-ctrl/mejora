/** Escuela — shell visual y sub-navegación */

import { subTabBar } from '/js/ui.js'

export const SCHOOL_SECTIONS = [
  { id: 'curriculum', label: 'Currículo', icon: '📅' },
  { id: 'explore', label: 'Explorar', icon: '🔍' },
  { id: 'apply', label: 'Aplicación', icon: '🌍' },
  { id: 'library', label: 'Biblioteca', icon: '📚' },
  { id: 'cases', label: 'Casos', icon: '🏛️' },
  { id: 'certs', label: 'Certificados', icon: '📜' },
]

export function normalizeSchoolSection(section) {
  if (!section || section === 'curriculum') return 'curriculum'
  if (section === 'academy' || section === 'catalog') return 'explore'
  return SCHOOL_SECTIONS.some(s => s.id === section) ? section : 'curriculum'
}

function progressRing(percent, size = 68) {
  const r = (size - 8) / 2
  const c = 2 * Math.PI * r
  const offset = c - (percent / 100) * c
  return `<div class="school-ring school-ring--sm" style="--ring-size:${size}px" aria-hidden="true">
    <svg viewBox="0 0 ${size} ${size}">
      <circle class="school-ring-bg" cx="${size/2}" cy="${size/2}" r="${r}" />
      <circle class="school-ring-fill" cx="${size/2}" cy="${size/2}" r="${r}"
        stroke-dasharray="${c}" stroke-dashoffset="${offset}" />
    </svg>
    <span class="school-ring-label">${percent}%</span>
  </div>`
}

export function renderSchoolSubNav(activeSection) {
  const section = normalizeSchoolSection(activeSection)
  return subTabBar(SCHOOL_SECTIONS, section, 'brainState.schoolSection', 'brainState.schoolFaculty=null;brainState.activePaper=null;')
}

export function renderSchoolHeader(stats) {
  if (!stats) return ''
  const dueStat = stats.due
    ? `<div class="brain-neural-stat brain-neural-stat--alert"><span class="brain-neural-stat__val">${stats.due}</span><span class="brain-neural-stat__lbl">repaso</span></div>`
    : ''
  return `<header class="brain-neural-hero brain-neural-hero--compact span-full">
    <div class="brain-neural-hero__glow" aria-hidden="true"></div>
    <div class="brain-neural-hero__scan" aria-hidden="true"></div>
    <div class="brain-neural-hero__head">
      <div class="brain-neural-hero__copy">
        <p class="brain-neural-hero__kicker">Escuela Mejora</p>
        <h1 class="brain-neural-hero__title font-display">Neurociencia aplicada</h1>
        <p class="brain-neural-hero__sub">Currículo de 12 semanas · ${stats.total} lecciones · investigación verificada</p>
      </div>
      <div class="brain-neural-hero__stats">
        <div class="brain-neural-stat"><span class="brain-neural-stat__val">${stats.percent}%</span><span class="brain-neural-stat__lbl">progreso</span></div>
        <div class="brain-neural-stat"><span class="brain-neural-stat__val">${stats.done}</span><span class="brain-neural-stat__lbl">leídas</span></div>
        <div class="brain-neural-stat"><span class="brain-neural-stat__val">${stats.week}/12</span><span class="brain-neural-stat__lbl">semana</span></div>
        ${dueStat}
      </div>
    </div>
  </header>`
}

export function renderSchoolBreadcrumbs(items = []) {
  if (!items.length) return ''
  return `<nav class="forge-breadcrumbs" aria-label="Ruta">
    ${items.map((item, i) => {
      const last = i === items.length - 1
      if (last) return `<span class="forge-crumb forge-crumb--current">${item.label}</span>`
      return `<a href="${item.href}" class="forge-crumb no-underline">${item.label}</a><span class="forge-crumb-sep">/</span>`
    }).join('')}
  </nav>`
}

export function wrapSchoolPage(content, section = 'curriculum', options = {}) {
  const stats = options.stats || null
  const showHeader = options.showHeader !== false
  const showSubNav = options.showSubNav !== false && !options.hideSubNav
  const zone = normalizeSchoolSection(section)
  const crumbs = options.breadcrumbs || [
    { label: 'Escuela', href: '#/gimnasia' },
    { label: SCHOOL_SECTIONS.find(s => s.id === zone)?.label || 'Currículo', href: `#/gimnasia` },
  ]
  return `<div class="school-campus animate-fade-in">
    ${renderSchoolBreadcrumbs(crumbs)}
    ${showHeader ? renderSchoolHeader(stats) : ''}
    ${showSubNav ? renderSchoolSubNav(zone) : ''}
    <div class="school-campus-body school-campus-body--${zone}">
      ${content}
    </div>
  </div>`
}

export function renderZoneHead(title, desc = '', meta = '') {
  return `<div class="school-zone-head">
    <div>
      <h2 class="school-zone-title">${title}</h2>
      ${desc ? `<p class="school-zone-desc">${desc}</p>` : ''}
    </div>
    ${meta ? `<span class="school-zone-meta">${meta}</span>` : ''}
  </div>`
}
