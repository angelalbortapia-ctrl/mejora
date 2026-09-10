/** Navegación central — una sola fuente de verdad para sidebar y rutas */
export const NAV_SECTIONS = [
  {
    label: 'Hoy',
    items: [
      { path: '/', label: 'Inicio', icon: '🏠', desc: 'Resumen del día' },
      { path: '/plan', label: 'Plan', icon: '📋', desc: 'Misiones diarias' },
      { path: '/hoy', label: 'Solo hoy', icon: '⚡', desc: 'Vista minimalista' },
    ],
  },
  {
    label: 'Crecimiento',
    items: [
      { path: '/gimnasia', label: 'Gimnasia', icon: '🧠', desc: 'Entrenamiento cerebral' },
      { path: '/meditacion', label: 'Calma', icon: '🧘', desc: 'Meditación guiada' },
      { path: '/mejora', label: 'Hábitos', icon: '✅', desc: 'Rutinas y diario' },
      { path: '/metas', label: 'Metas', icon: '🎯', desc: 'Objetivos 30 días' },
    ],
  },
  {
    label: 'Progreso',
    items: [
      { path: '/viaje', label: 'Mi viaje', icon: '📊', desc: 'Historial y consistencia' },
      { path: '/perfil', label: 'Perfil', icon: '🏆', desc: 'Logros y nivel' },
    ],
  },
]

const EXTRA_ROUTES = {
  '/rutina': { label: 'Rutina', icon: '⚔️', desc: 'Sesión guiada del día', section: 'Hoy' },
  '/ajustes': { label: 'Ajustes', icon: '⚙️', desc: 'Preferencias y respaldo', section: 'Sistema' },
  '/enfoque': { label: 'Enfoque', icon: '⏱️', desc: 'Temporizador Pomodoro', section: 'Hoy' },
  '/desafios': { label: 'Desafíos', icon: '⚔️', desc: 'Retos adicionales', section: 'Progreso' },
}

export const NAV_PATHS = [
  ...NAV_SECTIONS.flatMap(s => s.items.map(i => i.path)),
  ...Object.keys(EXTRA_ROUTES),
]

export function getNavMeta(path) {
  if (EXTRA_ROUTES[path]) return { path, ...EXTRA_ROUTES[path] }
  for (const section of NAV_SECTIONS) {
    const item = section.items.find(i => i.path === path)
    if (item) return { ...item, section: section.label }
  }
  return { path, label: 'Mejora', icon: '✦', desc: 'Tu espacio de crecimiento', section: 'App' }
}

function formatBannerDate() {
  return new Date().toLocaleDateString('es', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).replace('.', '')
}

export function mountSidebar() {
  const nav = document.getElementById('sidebar-nav')
  if (!nav || nav.dataset.mounted) return
  nav.innerHTML = NAV_SECTIONS.map(section => `
    <div class="sidebar-section">
      <p class="sidebar-section-label">${section.label}</p>
      ${section.items.map(item => `
        <a href="#${item.path}" data-path="${item.path}" class="sidebar-link no-underline" title="${item.desc}">
          <span class="sidebar-link-icon">${item.icon}</span>
          <span class="sidebar-link-text">
            <span class="sidebar-link-label">${item.label}</span>
            <span class="sidebar-link-desc">${item.desc}</span>
          </span>
        </a>`).join('')}
    </div>`).join('')
  nav.dataset.mounted = '1'
}

export function initLayout() {
  mountSidebar()
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
    rankIcon = '🌱',
    userName = '',
    shield = null,
    weather = null,
  } = data

  const sectionEl = document.getElementById('banner-section')
  const pageCrumbEl = document.getElementById('banner-page')
  const titleEl = document.getElementById('page-title')
  const subtitleEl = document.getElementById('page-subtitle')
  const planTextEl = document.getElementById('banner-plan-text')
  const planBarEl = document.getElementById('banner-plan-bar')
  const streakTextEl = document.getElementById('banner-streak-text')
  const dateEl = document.getElementById('banner-date')
  const ctaEl = document.getElementById('banner-cta')
  const avatarEl = document.getElementById('banner-avatar-icon')

  if (sectionEl) sectionEl.textContent = meta.section || 'App'
  if (pageCrumbEl) pageCrumbEl.textContent = meta.label
  if (titleEl) titleEl.textContent = meta.label
  if (subtitleEl) subtitleEl.textContent = meta.desc
  if (planTextEl) planTextEl.textContent = `${planDone}/${planTotal}`
  if (planBarEl) planBarEl.style.width = `${planPercent}%`
  if (streakTextEl) streakTextEl.textContent = String(streak)
  document.querySelector('.banner-metric-streak')?.classList.toggle('banner-streak-hot', streak >= 3)

  const weatherIconEl = document.getElementById('banner-weather-icon')
  const weatherTempEl = document.getElementById('banner-weather-temp')
  const weatherLabelEl = document.getElementById('banner-weather-label')
  const weatherWrapEl = document.getElementById('banner-weather-wrap')
  if (weatherWrapEl) {
    if (weather?.temp != null) {
      weatherWrapEl.classList.remove('hidden')
      if (weatherIconEl) weatherIconEl.textContent = weather.icon || '🌤️'
      if (weatherTempEl) weatherTempEl.textContent = `${Math.round(weather.temp)}°`
      if (weatherLabelEl) weatherLabelEl.textContent = weather.label || 'clima'
    } else {
      weatherWrapEl.classList.add('hidden')
    }
  }

  if (dateEl) {
    dateEl.textContent = formatBannerDate()
    dateEl.dateTime = new Date().toISOString().split('T')[0]
  }
  if (avatarEl) avatarEl.textContent = rankIcon
  if (ctaEl) {
    if (path === '/plan') {
      ctaEl.textContent = planAllDone ? '✓ Completado' : 'Ver misiones'
      ctaEl.href = '#/plan'
    } else if (planAllDone) {
      ctaEl.textContent = '✨ Día perfecto'
      ctaEl.href = '#/perfil'
    } else {
      ctaEl.textContent = 'Continuar plan'
      ctaEl.href = '#/plan'
    }
    ctaEl.classList.toggle('banner-cta-done', planAllDone)
  }

  document.getElementById('app-banner')?.classList.toggle('banner-plan-complete', planAllDone)

  const shieldEl = document.getElementById('banner-shield')
  if (shieldEl && shield) {
    if (!shield.unlocked) {
      shieldEl.classList.add('hidden')
    } else {
      shieldEl.classList.remove('hidden')
      shieldEl.classList.toggle('available', shield.available)
      shieldEl.classList.toggle('used', shield.used && !shield.available)
      shieldEl.title = shield.available
        ? 'Escudo de racha disponible este mes'
        : shield.used ? 'Escudo usado este mes' : 'Escudo de racha'
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
  document.querySelectorAll('.sidebar-link[data-path]').forEach(el => {
    const match = el.dataset.path === path || (path === '/ajustes' && el.dataset.path === '/ajustes')
    el.classList.toggle('active', match)
  })
}

export function updateSidebarStats({ streak, level, rankTitle, planPercent }) {
  const streakEl = document.getElementById('sidebar-streak')
  const levelEl = document.getElementById('sidebar-level')
  const planEl = document.getElementById('sidebar-plan')
  if (streakEl) streakEl.textContent = streak > 0 ? `🔥 ${streak}` : '—'
  if (levelEl) levelEl.textContent = rankTitle ? `${rankTitle} · Nv.${level}` : `Nv.${level}`
  if (planEl) planEl.style.width = `${planPercent || 0}%`
}
