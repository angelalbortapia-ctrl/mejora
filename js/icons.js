/** Iconografía SVG — sistema visual Mejora */

const PATHS = {
  home: '<path d="M4 10.5L12 4l8 6.5V20a1 1 0 01-1 1h-5v-6H10v6H5a1 1 0 01-1-1v-9.5z"/>',
  plan: '<path d="M6 4h12a1 1 0 011 1v14a1 1 0 01-1 1H6a1 1 0 01-1-1V5a1 1 0 011-1zm2 3h8M8 11h8M8 15h5"/>',
  brain: '<circle cx="12" cy="12" r="3"/><path d="M12 2a7 7 0 017 7c0 2.5-1.2 4.7-3 6.1V18H8v-2.9A7 7 0 0112 2z"/>',
  calm: '<path d="M12 3c-4 0-7 3-7 7 0 5 7 11 7 11s7-6 7-11c0-4-3-7-7-7z"/><circle cx="12" cy="10" r="2"/>',
  habit: '<path d="M9 12l2 2 4-4"/><rect x="4" y="4" width="16" height="16" rx="3"/>',
  goal: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/>',
  journey: '<path d="M4 19V5M8 19V11M12 19V8M16 19V14M20 19V6"/>',
  profile: '<circle cx="12" cy="8" r="4"/><path d="M6 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/>',
  focus: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/>',
  streak: '<path d="M12 2c1 3 4 5 4 9a4 4 0 11-8 0c0-4 3-6 4-9z"/>',
  xp: '<path d="M12 2l1.8 5.5L19 9l-5.2 1.5L12 16l-1.8-5.5L5 9l5.2-1.5L12 2z"/>',
  shield: '<path d="M12 3l8 4v5c0 5-3.5 8.5-8 9-4.5-.5-8-4-8-9V7l8-4z"/>',
  spark: '<path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z"/>',
  check: '<path d="M5 12l4 4L19 7"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2"/>',
  play: '<path d="M8 6l10 6-10 6V6z"/>',
  pause: '<path d="M9 7h2v10H9zM13 7h2v10h-2z"/>',
  wave: '<path d="M2 12c2-3 4-3 6 0s4 3 6 0 4-3 6 0"/>',
  activity: '<path d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a2 2 0 0 1-3.86 0l-3.24-8.8A2 2 0 0 0 7.48 12H2"/>',
  flask: '<path d="M10 2v7.527a2 2 0 0 1-.211.896L4.72 20.55a1 1 0 0 0 .9 1.45h12.76a1 1 0 0 0 .9-1.45l-5.069-10.127A2 2 0 0 1 14 9.527V2"/><path d="M8.5 2h7"/><path d="M7 16h10"/>',
  zap: '<path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/>',
  target: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
  chart: '<path d="M3 3v16a2 2 0 0 0 2 2h16"/><path d="M7 16h8"/><path d="M7 11h12"/><path d="M7 6h3"/>',
}

function resolveIconOpts(second) {
  if (typeof second === 'string') return { className: second }
  if (second && typeof second === 'object') return second
  return {}
}

/**
 * @param {string} name
 * @param {string | { size?: number, className?: string, stroke?: string }} [opts]
 */
export function icon(name, opts = 'mi-icon') {
  const { size, className = 'mi-icon', stroke = 'currentColor' } = resolveIconOpts(opts)
  const body = PATHS[name] || PATHS.spark
  const cls = className || 'mi-icon'
  const sizeAttrs = size ? ` width="${size}" height="${size}"` : ''
  return `<svg class="${cls}"${sizeAttrs} viewBox="0 0 24 24" fill="none" stroke="${stroke}" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`
}

export function hasIcon(name) {
  return Boolean(PATHS[name])
}

export function iconBadge(name, label, cls = '') {
  return `<span class="mi-badge ${cls}" title="${label}">${icon(name, 'mi-icon mi-icon--badge')}</span>`
}

export function rankIcon(level = 1) {
  const tier = level >= 50 ? 'spark' : level >= 35 ? 'shield' : level >= 20 ? 'xp' : level >= 10 ? 'streak' : 'check'
  return icon(tier, 'mi-icon mi-icon--rank')
}
