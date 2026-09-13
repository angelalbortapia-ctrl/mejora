/** Tema neuronal compartido — hero, stats, pasos siguientes */

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
  compact = true,
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

export function renderNextSteps(steps) {
  const items = steps.filter(Boolean)
  if (!items.length) return ''
  return `<section class="brain-next-steps span-full">
    <h2 class="brain-section-title">Tu siguiente paso</h2>
    <ol class="brain-next-steps__list">
      ${items.map((s, i) => `<li class="brain-next-step ${s.done ? 'is-done' : ''} ${s.primary ? 'is-primary' : ''}">
        <span class="brain-next-step__num">${i + 1}</span>
        <div class="brain-next-step__body">
          <p class="brain-next-step__label">${esc(s.label)}</p>
          ${s.meta ? `<p class="brain-next-step__meta">${esc(s.meta)}</p>` : ''}
        </div>
        ${s.done
          ? '<span class="brain-next-step__badge">✓</span>'
          : `<button type="button" class="btn-${s.primary ? 'primary' : 'secondary'} brain-next-step__btn" onclick="${s.action}">${esc(s.cta)}</button>`}
      </li>`).join('')}
    </ol>
  </section>`
}

export function renderNeuralCard(content, { primary = false, className = '' } = {}) {
  const cls = ['brain-neural-card', primary ? 'brain-neural-card--primary' : '', className].filter(Boolean).join(' ')
  return `<div class="${cls}">${content}</div>`
}
