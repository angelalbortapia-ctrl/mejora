/** Analytics de producto — local, sin terceros, orientado a funnel y retención */

import { getItem, setItem, toDateStr } from '/js/core.js'

const MAX_EVENTS = 600
const STORE_KEY = 'productEvents'

export const EVENTS = {
  HABIT_COMPLETE: 'habit_complete',
  MEDITATION_COMPLETE: 'meditation_complete',
  BRAIN_SESSION: 'brain_session',
  SCHOOL_LESSON: 'school_lesson',
  LEVEL_UP: 'level_up',
  UNLOCK: 'unlock',
  SHARE: 'share',
  PLAN_COMPLETE: 'plan_complete',
  APP_OPEN: 'app_open',
}

export function trackProductEvent(name, props = {}) {
  if (!name) return
  const events = getItem(STORE_KEY, [])
  events.push({
    name,
    props: props && typeof props === 'object' ? props : {},
    at: new Date().toISOString(),
  })
  if (events.length > MAX_EVENTS) events.splice(0, events.length - MAX_EVENTS)
  setItem(STORE_KEY, events)
}

export function getProductEvents(limit = MAX_EVENTS) {
  const events = getItem(STORE_KEY, [])
  return events.slice(-limit)
}

function eventsSince(days) {
  const cutoff = Date.now() - days * 86400000
  return getProductEvents().filter(e => new Date(e.at).getTime() >= cutoff)
}

export function countEventsByName(events) {
  const counts = {}
  for (const e of events) counts[e.name] = (counts[e.name] || 0) + 1
  return counts
}

export function getProductAnalyticsSummary() {
  const last7 = eventsSince(7)
  const last30 = eventsSince(30)
  return {
    total: getProductEvents().length,
    last7: countEventsByName(last7),
    last30: countEventsByName(last30),
    funnel30: {
      habits: last30.filter(e => e.name === EVENTS.HABIT_COMPLETE).length,
      calm: last30.filter(e => e.name === EVENTS.MEDITATION_COMPLETE).length,
      brain: last30.filter(e => e.name === EVENTS.BRAIN_SESSION).length,
      school: last30.filter(e => e.name === EVENTS.SCHOOL_LESSON).length,
      shares: last30.filter(e => e.name === EVENTS.SHARE).length,
    },
    lastEventAt: getProductEvents().at(-1)?.at || null,
  }
}

export function formatAnalyticsPanel(tFn = k => k) {
  const s = getProductAnalyticsSummary()
  const rows = Object.entries(s.last7)
  if (!rows.length && !s.total) {
    return `<p class="ds-setting-hint">${tFn('analytics.empty')}</p>`
  }
  const funnel = s.funnel30
  const total7 = Object.values(s.last7).reduce((sum, n) => sum + n, 0)
  return `
    <p class="ds-setting-hint">${tFn('analytics.subtitle')}</p>
    <div class="ds-stat-row mt-3">
      ${[
        [tFn('analytics.last7'), total7],
        ['Hábitos', funnel.habits],
        ['Calma', funnel.calm],
        ['Gimnasia', funnel.brain],
      ].map(([label, val]) => `
        <div class="ds-stat">
          <p class="ds-stat-value">${val}</p>
          <p class="ds-stat-label">${label}</p>
        </div>`).join('')}
    </div>
    ${rows.length ? `<ul class="ds-setting-hint mt-3" style="margin:0;padding-left:1.1rem">
      ${rows.map(([name, n]) => `<li>${name}: <strong>${n}</strong></li>`).join('')}
    </ul>` : ''}`
}
