import { icon, rankIcon } from '/js/icons.js'
import { t } from '/js/i18n.js'

/** Navegación — 5 destinos claros (labels vía i18n en runtime) */
export function getNavSections() {
  return [
    {
      label: '',
      items: [
        { path: '/', label: t('nav.home'), iconKey: 'home', desc: t('navDesc.home') },
        { path: '/mejora', label: t('nav.habits'), iconKey: 'habit', desc: t('navDesc.habits') },
        { path: '/gimnasia', label: t('nav.brain'), iconKey: 'brain', desc: t('navDesc.brain') },
        { path: '/meditacion', label: t('nav.calm'), iconKey: 'calm', desc: t('navDesc.calm') },
        { path: '/perfil', label: t('nav.profile'), iconKey: 'profile', desc: t('navDesc.profile') },
      ],
    },
  ]
}

export const NAV_SECTIONS = getNavSections()

function getExtraRoutes() {
  return {
    '/plan': { label: t('nav.plan'), icon: '📋', desc: t('navDesc.home'), section: t('nav.home') },
    '/metas': { label: t('nav.goals'), icon: '🎯', desc: t('navDesc.profile'), section: t('nav.profile') },
    '/viaje': { label: t('nav.journey'), icon: '📊', desc: t('navDesc.profile'), section: t('nav.profile') },
    '/hoy': { label: t('nav.solo'), icon: '◎', desc: t('navDesc.home'), section: t('nav.home') },
    '/rutina': { label: t('nav.routine'), icon: '🌅', desc: t('navDesc.home'), section: t('nav.home') },
    '/enfoque': { label: t('nav.focus'), icon: '⏱️', desc: t('navDesc.home'), section: t('nav.home') },
    '/ajustes': { label: t('nav.settings'), icon: '⚙️', desc: t('nav.settings'), section: t('nav.settings') },
  }
}

export function getNavPaths() {
  return [
    ...getNavSections().flatMap(s => s.items.map(i => i.path)),
    ...Object.keys(getExtraRoutes()),
  ]
}

export const NAV_PATHS = getNavPaths()

export function getBottomNav() {
  return [
    { path: '/', iconKey: 'home', label: t('nav.home') },
    { path: '/mejora', iconKey: 'habit', label: t('nav.habits') },
    { path: '/gimnasia', iconKey: 'brain', label: t('nav.brain') },
    { path: '/meditacion', iconKey: 'calm', label: t('nav.calm') },
    { path: '/perfil', iconKey: 'profile', label: t('nav.profile') },
  ]
}

export const BOTTOM_NAV = getBottomNav()

function navIconMarkup(item) {
  return item.iconKey ? icon(item.iconKey, 'nav-svg') : (item.icon || '')
}

export function getSectionHomePath(sectionLabel) {
  if (!sectionLabel || sectionLabel === 'Mejora' || sectionLabel === 'App' || sectionLabel === t('nav.profile')) return '/'
  const section = getNavSections().find(s => s.label === sectionLabel)
  return section?.items[0]?.path || '/'
}

export function normalizeNavPath(path) {
  const base = '/' + (path.split('/').filter(Boolean)[0] || '')
  return getNavPaths().includes(base) ? base : '/'
}

export function getNavMeta(path) {
  const extra = getExtraRoutes()
  if (extra[path]) return { path, ...extra[path] }
  for (const section of getNavSections()) {
    const item = section.items.find(i => i.path === path)
    if (item) return { ...item, section: section.label || 'Mejora' }
  }
  return { path, label: 'Mejora', icon: '✦', desc: t('navDesc.profile'), section: 'App' }
}

function formatBannerDate() {
  return new Date().toLocaleDateString('es', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).replace('.', '')
}

export function remountNav() {
  const sidebarNav = document.getElementById('sidebar-nav')
  const bottomNav = document.getElementById('bottom-nav')
  if (sidebarNav) sidebarNav.dataset.mounted = ''
  if (bottomNav) bottomNav.dataset.mounted = ''
  mountSidebar()
  mountBottomNav()
}

export function mountSidebar() {
  const nav = document.getElementById('sidebar-nav')
  if (!nav || nav.dataset.mounted === 'v6') return
  nav.innerHTML = getNavSections().map(section => `
    <div class="sidebar-section">
      ${section.label ? `<p class="sidebar-section-label">${section.label}</p>` : ''}
      ${section.items.map(item => `
        <a href="#${item.path}" data-path="${item.path}" class="sidebar-link no-underline" title="${item.desc}">
          <span class="sidebar-link-icon">${navIconMarkup(item)}</span>
          <span class="sidebar-link-text">
            <span class="sidebar-link-label">${item.label}</span>
          </span>
        </a>`).join('')}
    </div>`).join('')
  nav.dataset.mounted = 'v6'
}

export function mountBottomNav() {
  const el = document.getElementById('bottom-nav')
  if (!el || el.dataset.mounted === 'v6') return
  el.innerHTML = getBottomNav().map(item => `
    <a href="#${item.path}" data-path="${item.path}" class="bottom-nav-link no-underline" title="${item.label}">
      <span class="bottom-nav-icon" aria-hidden="true">${navIconMarkup(item)}</span>
      <span class="bottom-nav-label">${item.label}</span>
    </a>`).join('')
  el.dataset.mounted = 'v6'
}

export function updateBottomNav(path) {
  const normalized = normalizeNavPath(path)
  document.querySelectorAll('.bottom-nav-link[data-path]').forEach(el => {
    el.classList.toggle('active', el.dataset.path === normalized)
  })
}

export function initLayout() {
  mountSidebar()
  mountBottomNav()
  const sidebar = document.getElementById('sidebar')
  const backdrop = document.getElementById('sidebar-backdrop')
  const toggle = document.getElementById('sidebar-toggle')
  const close = document.getElementById('sidebar-close')

  const open = () => {
    sidebar?.classList.add('open')
    backdrop?.classList.add('open')
    document.body.classList.add('sidebar-open')
  }
  const shut = () => {
    sidebar?.classList.remove('open')
    backdrop?.classList.remove('open')
    document.body.classList.remove('sidebar-open')
  }

  toggle?.addEventListener('click', open)
  close?.addEventListener('click', shut)
  backdrop?.addEventListener('click', shut)

  document.querySelectorAll('.sidebar-link[data-path]').forEach(el => {
    el.addEventListener('click', () => {
      if (window.innerWidth < 1024) shut()
    })
  })

  window.addEventListener('resize', () => {
    if (window.innerWidth >= 1024) shut()
  })
}

export function updateTopBanner(path, data = {}) {
  const meta = getNavMeta(path)
  const {
    streak = 0,
    planPercent = 0,
    planDone = 0,
    planTotal = 0,
    planAllDone = false,
    rankLevel = 1,
    userName = '',
    shield = null,
    weather = null,
  } = data

  const pageCrumbEl = document.getElementById('banner-page')
  const titleEl = document.getElementById('page-title')
  const subtitleEl = document.getElementById('page-subtitle')
  const planTextEl = document.getElementById('banner-plan-text')
  const planBarEl = document.getElementById('banner-plan-bar')
  const streakTextEl = document.getElementById('banner-streak-text')
  const dateEl = document.getElementById('banner-date')
  const ctaEl = document.getElementById('banner-cta')
  const avatarEl = document.getElementById('banner-avatar-icon')

  const sectionLink = document.getElementById('banner-section-link')
  if (sectionLink) {
    sectionLink.textContent = meta.section || 'Mejora'
    sectionLink.href = `#${getSectionHomePath(meta.section) || '/'}`
  }
  if (pageCrumbEl) pageCrumbEl.textContent = meta.label
  if (titleEl) titleEl.textContent = meta.label
  if (subtitleEl) subtitleEl.textContent = meta.desc
  if (planTextEl) planTextEl.textContent = `${planDone}/${planTotal}`
  if (planBarEl) planBarEl.style.width = `${planPercent}%`
  if (streakTextEl) streakTextEl.textContent = String(streak)
  document.querySelector('.banner-metric-streak')?.classList.toggle('banner-streak-hot', streak >= 3)

  const weatherWrapEl = document.getElementById('banner-weather-wrap')
  const weatherIconEl = document.getElementById('banner-weather-icon')
  const weatherTempEl = document.getElementById('banner-weather-temp')
  const weatherLabelEl = document.getElementById('banner-weather-label')
  if (weatherWrapEl) {
    if (weather) {
      weatherWrapEl.classList.remove('hidden')
      if (weatherIconEl) weatherIconEl.textContent = weather.icon || '🌤️'
      if (weatherTempEl) weatherTempEl.textContent = `${weather.temp}°`
      if (weatherLabelEl) weatherLabelEl.textContent = weather.label || 'clima'
    } else {
      weatherWrapEl.classList.add('hidden')
    }
  }

  if (dateEl) {
    dateEl.textContent = formatBannerDate()
    dateEl.dateTime = new Date().toISOString().split('T')[0]
  }
  if (avatarEl) avatarEl.innerHTML = rankIcon(rankLevel)
  if (ctaEl) {
    if (path === '/') {
      ctaEl.textContent = planAllDone ? 'Día completo' : 'Ver lista'
      ctaEl.href = '#/'
    } else if (planAllDone) {
      ctaEl.textContent = 'Día completo'
      ctaEl.href = '#/'
    } else {
      ctaEl.textContent = 'Ir a hoy'
      ctaEl.href = '#/'
    }
    ctaEl.classList.toggle('banner-cta-done', planAllDone)
  }

  document.getElementById('app-banner')?.classList.toggle('banner-plan-complete', planAllDone)

  const shieldEl = document.getElementById('banner-shield')
  if (shieldEl) {
    if (shield?.unlocked) {
      shieldEl.classList.remove('hidden')
      shieldEl.classList.toggle('available', !!shield.available)
      shieldEl.classList.toggle('used', !!shield.used)
      shieldEl.title = shield.available
        ? 'Escudo de racha disponible este mes'
        : 'Escudo de racha ya usado este mes'
    } else {
      shieldEl.classList.add('hidden')
    }
  }

  const greeting = userName ? ` · ${userName}` : ''
  document.title = `${meta.label}${greeting} — Mejora`
}

export function applyCompactSidebar(compact) {
  document.body.classList.toggle('sidebar-compact', !!compact)
  const w = document.getElementById('sidebar')
  if (w) w.classList.toggle('compact', !!compact)
}

export function setActiveNav(path) {
  const normalized = normalizeNavPath(path)
  document.querySelectorAll('.sidebar-link[data-path]').forEach(el => {
    const match = el.dataset.path === normalized || (normalized === '/ajustes' && el.dataset.path === '/ajustes')
    el.classList.toggle('active', match)
  })
  updateBottomNav(path)
}

export function updateSidebarStats({ streak, level, rankTitle, planPercent }) {
  const streakEl = document.getElementById('sidebar-streak')
  const levelEl = document.getElementById('sidebar-level')
  const planEl = document.getElementById('sidebar-plan')
  if (streakEl) streakEl.textContent = streak > 0 ? `🔥 ${streak}` : '—'
  if (levelEl) levelEl.textContent = rankTitle ? `${rankTitle} · Nv.${level}` : `Nv.${level}`
  if (planEl) planEl.style.width = `${planPercent || 0}%`
}
