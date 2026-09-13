/** Página Inicio — v3: simple, claro, accionable */

import {
  esc, getSettings, getStreak, getToday, ensureDailyPlan, getPlanProgress,
  getHabits, isHabitComplete, getMood, needsOnboarding, syncGoals,
} from '/js/core.js'
import {
  HOME_SHORTCUTS, getDailyIntention, MOOD_COACH,
} from '/js/coaching.js'
import { homeInsightHTML } from '/js/apis.js'
import { renderHomeNeuroCard } from '/js/brain-academy.js'
import { renderHomeReviewBanner } from '/js/school.js'
import { getPremiumCoach } from '/js/coach-engine.js'

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Buenos días'
  if (h < 19) return 'Buenas tardes'
  return 'Buenas noches'
}

function formatDate() {
  return new Date().toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' })
}

function nowCardHTML() {
  const coach = getPremiumCoach()
  const done = coach.priority === 'done'
  const chips = coach.chips?.length
    ? `<div class="m-coach-chips">${coach.chips.map(c => `<span class="m-coach-chip">${c.icon} ${c.label}</span>`).join('')}</div>`
    : ''
  return `<a href="${coach.link}" class="m-now m-now--${coach.tone || 'focus'} ${done ? 'm-now--done' : ''} no-underline">
    <p class="m-now-label">${done ? 'Listo por hoy' : 'Tu coach de hoy'}</p>
    <p class="m-now-title">${coach.icon} ${coach.title}</p>
    <p class="m-now-insight">${coach.insight}</p>
    <p class="m-now-desc">${coach.desc}</p>
    ${chips}
    <span class="m-now-cta">${coach.cta} →</span>
  </a>`
}

function todayListHTML() {
  const plan = ensureDailyPlan()
  const progress = getPlanProgress()
  return `<section class="m-section">
    <div class="m-section-head">
      <h2 class="m-section-title">Para hoy</h2>
      <span class="m-section-meta">${progress.done} de ${progress.total}</span>
    </div>
    <ul class="m-checklist">
      ${plan.tasks.map(t => `
        <li>
          <a href="${t.link}" class="m-task ${t.done ? 'is-done' : ''} no-underline">
            <span class="m-task-check">${t.done ? '✓' : ''}</span>
            <span class="m-task-body">
              <span class="m-task-label">${esc(t.label)}</span>
              ${t.brief ? `<span class="m-task-brief">${esc(t.brief)}</span>` : ''}
            </span>
            ${t.done ? '' : `<span class="m-task-xp">+${t.xp}</span>`}
          </a>
        </li>`).join('')}
    </ul>
    ${progress.allDone
      ? '<p class="m-section-meta" style="margin:0.75rem 0 0">Completaste el plan de hoy. Descansa o repite lo que te hizo bien.</p>'
      : ''}
  </section>`
}

function habitsRowHTML() {
  const habits = getHabits()
  if (!habits.length) return ''
  const done = habits.filter(h => isHabitComplete(h)).length
  return `<section class="m-section">
    <div class="m-section-head">
      <h2 class="m-section-title">Hábitos</h2>
      <span class="m-section-meta">${done}/${habits.length}</span>
    </div>
    <div class="m-habits-row">
      ${habits.map(h => {
        const ok = isHabitComplete(h)
        return `<a href="#/mejora" class="m-habit-chip ${ok ? 'is-done' : ''} no-underline">
          <span>${h.icon}</span>
          <span>${esc(h.name)}</span>
          <span>${ok ? '✓' : ''}</span>
        </a>`
      }).join('')}
    </div>
  </section>`
}

function shortcutsHTML() {
  return `<div class="m-shortcuts">
    ${HOME_SHORTCUTS.map(s => `
      <a href="${s.href}" ${s.onclick ? `onclick="${s.onclick}"` : ''} class="m-shortcut no-underline">
        <span class="m-shortcut-icon">${s.icon}</span>
        <span class="m-shortcut-title">${s.title}</span>
        <span class="m-shortcut-desc">${s.desc}</span>
      </a>`).join('')}
  </div>`
}

function moodSectionHTML(moodPickerHTML) {
  const mood = getMood(getToday())
  if (mood) {
    const coach = MOOD_COACH[mood.id]
    return `<div class="m-mood">
      <p class="m-mood-label">Cómo te sientes</p>
      <span>${mood.emoji} ${mood.label}</span>
      ${coach ? `<a href="${coach.link}" class="m-footer-link" style="margin-left:auto">${coach.cta} →</a>` : ''}
    </div>`
  }
  return `<div class="m-section">
    <p class="m-section-title" style="margin:0 0 0.75rem;font-size:1rem">¿Cómo amaneció el día?</p>
    ${moodPickerHTML('home')}
  </div>`
}

function guidesStripHTML() {
  if (needsOnboarding()) return ''
  return `<section class="m-section m-guides-strip">
    <div class="m-section-head">
      <h2 class="m-section-title">Guías rápidas</h2>
    </div>
    <div class="m-guides-btns">
      <button type="button" class="btn-ghost text-sm" onclick="startSectionGuideFromHome('enfoque')">◎ Enfoque</button>
      <button type="button" class="btn-ghost text-sm" onclick="startSectionGuideFromHome('calma')">🫧 Calma</button>
      <a href="#/ajustes" onclick="settingsTab='data';setTimeout(render,0)" class="btn-ghost text-sm no-underline">Todas →</a>
    </div>
  </section>`
}

export function bindHomeGlobals({ startGuide }) {
  window.startSectionGuideFromHome = (id) => startGuide(id, () => window.render?.(true))
}

function footerLinksHTML() {
  const goals = syncGoals().filter(g => g.active)
  return `<nav class="m-footer-nav" aria-label="Más secciones">
    <a href="#/metas" class="m-footer-link">${goals.length ? 'Tu meta activa' : 'Definir una meta'}</a>
    <a href="#/viaje" class="m-footer-link">Tu historial</a>
    <a href="#/enfoque" class="m-footer-link">Modo enfoque</a>
    <a href="#/rutina" class="m-footer-link">Rutina guiada</a>
  </nav>`
}

export function renderHome({ moodPickerHTML, dailyApis, dailyApisLoading }) {
  const settings = getSettings()
  const name = settings.userName ? esc(settings.userName) : 'ahí'
  const streak = getStreak()
  const progress = getPlanProgress()

  return `<div class="animate-fade-in page-shell page-home page-home--v3">
    <main class="m-home">
      <div class="m-home-top">
        <header class="m-home-header">
          <p class="m-home-date">${formatDate()}</p>
          <h1 class="m-home-title">${greeting()}, ${name}</h1>
          <p class="m-home-lead">${getDailyIntention()}</p>
          <p class="m-progress-pill" id="home-plan-pill">
            <span>🔥 <strong>${streak}</strong> días</span>
            <span>· Plan <strong>${progress.percent}%</strong> (${progress.done}/${progress.total})</span>
          </p>
        </header>
        ${needsOnboarding() ? '' : nowCardHTML()}
      </div>

      <div class="m-home-body">
        <div class="m-home-main">
          ${renderHomeReviewBanner()}
          ${todayListHTML()}
          ${renderHomeNeuroCard()}
        </div>
        <aside class="m-home-side">
          ${habitsRowHTML()}
          ${guidesStripHTML()}
          ${shortcutsHTML()}
          ${moodSectionHTML(moodPickerHTML)}
        </aside>
      </div>

      ${footerLinksHTML()}
    </main>
  </div>`
}
