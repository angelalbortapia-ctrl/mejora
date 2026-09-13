/** Tema neuronal compartido — hero, stats y envoltura visual */

import { esc } from './core.js'

export function renderNeuralStat(val, label) {
  return `<div class="brain-neural-stat">
    <span class="brain-neural-stat__val">${val}</span>
    <span class="brain-neural-stat__lbl">${esc(label)}</span>
  </div>`
}

export function renderNeuralHero({
  kicker = '',
  title = '',
  sub = '',
  stats = [],
  compact = false,
  className = '',
} = {}) {
  const cls = [
    'brain-neural-hero',
    'span-full',
    compact ? 'brain-neural-hero--compact' : '',
    className,
  ].filter(Boolean).join(' ')
  return `<header class="${cls}">
    <div class="brain-neural-hero__glow" aria-hidden="true"></div>
    <div class="brain-neural-hero__scan" aria-hidden="true"></div>
    <div class="brain-neural-hero__head">
      <div class="brain-neural-hero__copy">
        ${kicker ? `<p class="brain-neural-hero__kicker">${esc(kicker)}</p>` : ''}
        ${title ? `<h1 class="brain-neural-hero__title font-display">${esc(title)}</h1>` : ''}
        ${sub ? `<p class="brain-neural-hero__sub">${esc(sub)}</p>` : ''}
      </div>
      ${stats.length ? `<div class="brain-neural-hero__stats">${stats.map(s => renderNeuralStat(s.val, s.lbl)).join('')}</div>` : ''}
    </div>
  </header>`
}

export function renderNeuralCard(content, { primary = false, className = '' } = {}) {
  const cls = ['brain-neural-card', primary ? 'brain-neural-card--primary' : '', className].filter(Boolean).join(' ')
  return `<div class="${cls}">${content}</div>`
}
