/** vision-01 — Perfil cognitivo longitudinal */

import { esc } from '/js/core.js'
import { COGNITIVE_DOMAINS, EXERCISES } from '/js/brain-program.js'
import { getProtocolHistory } from '/js/brain-metrics.js'
import { CLINICAL_PROTOCOLS } from '/js/brain-clinical-lab.js'
import { icon } from '/js/icons.js'

const CLINICAL_IDS = [...CLINICAL_PROTOCOLS]

export function getLongitudinalProfile() {
  const domains = {}
  let totalSessions = 0
  let lastTs = 0

  CLINICAL_IDS.forEach(exId => {
    const ex = EXERCISES[exId]
    if (!ex?.domain) return
    const hist = getProtocolHistory(exId)
    if (!hist.length) return
    totalSessions += hist.length
    const top = hist[0]?.ts || 0
    if (top > lastTs) lastTs = top

    const accs = hist.slice(0, 10).map(h => h.metrics?.accuracy).filter(v => typeof v === 'number')
    if (!accs.length) return
    const avg = accs.reduce((a, b) => a + b, 0) / accs.length
    const trend = accs.length >= 2 ? accs[0] - accs[accs.length - 1] : 0

    if (!domains[ex.domain]) {
      domains[ex.domain] = {
        domain: COGNITIVE_DOMAINS[ex.domain],
        exercises: [],
        avgSum: 0,
        count: 0,
      }
    }
    domains[ex.domain].exercises.push({
      id: exId,
      name: ex.name,
      icon: ex.icon,
      avg: Math.round(avg),
      trend: Math.round(trend),
      sessions: hist.length,
      spark: accs.slice(0, 7).reverse(),
    })
    domains[ex.domain].avgSum += avg
    domains[ex.domain].count++
  })

  const domainList = Object.entries(domains).map(([id, d]) => ({
    id,
    name: d.domain?.name || id,
    icon: d.domain?.icon || '🧠',
    color: d.domain?.color || '#8b5cf6',
    avg: Math.round(d.avgSum / Math.max(1, d.count)),
    exercises: d.exercises.sort((a, b) => a.avg - b.avg),
    sessions: d.exercises.reduce((s, e) => s + e.sessions, 0),
  })).sort((a, b) => a.avg - b.avg)

  return {
    domains: domainList,
    totalSessions,
    lastDate: lastTs ? new Date(lastTs).toISOString().slice(0, 10) : null,
    hasData: domainList.length > 0,
  }
}

function sparkBars(values, color) {
  if (!values?.length) return '<span class="brain-profile__spark-empty">—</span>'
  const max = Math.max(...values, 1)
  return `<div class="brain-profile__spark">${values.map(v =>
    `<div class="brain-profile__spark-bar" style="height:${Math.max(12, Math.round(v / max * 100))}%;background:${color}" title="${v}%"></div>`
  ).join('')}</div>`
}

export function renderBrainProfileCard() {
  const p = getLongitudinalProfile()
  if (!p.hasData) {
    return `<section class="brain-profile brain-profile--empty span-full">
      <div class="brain-profile__head">
        <p class="brain-profile__label">${icon('activity', { size: 14 })} Perfil cognitivo</p>
      </div>
      <div class="brain-profile__empty-body">
        <img src="/public/illustrations/lab-clinical.svg" alt="" class="brain-profile__illus" width="120" height="90" loading="lazy">
        <p class="text-sm text-muted">Completa protocolos clínicos para ver tu perfil longitudinal por dominio.</p>
      </div>
    </section>`
  }

  const rows = p.domains.map(d => {
    const weakest = d.exercises[0]
    const trendLabel = weakest?.trend > 4 ? '↑ mejorando' : weakest?.trend < -4 ? '↓ bajando' : '→ estable'
    return `<div class="brain-profile__row">
      <div class="brain-profile__row-head">
        <span class="brain-profile__domain-icon">${d.icon}</span>
        <div>
          <p class="brain-profile__domain-name">${esc(d.name)}</p>
          <p class="brain-profile__domain-meta font-metric">${d.avg}% media · ${d.sessions} sesiones · ${trendLabel}</p>
        </div>
        <span class="brain-profile__domain-score font-metric">${d.avg}%</span>
      </div>
      ${sparkBars(weakest?.spark, d.color)}
    </div>`
  }).join('')

  return `<section class="brain-profile span-full">
    <div class="brain-profile__head">
      <p class="brain-profile__label">${icon('activity', { size: 14 })} Perfil cognitivo longitudinal</p>
      <span class="brain-profile__meta font-metric">${p.totalSessions} sesiones${p.lastDate ? ` · ${p.lastDate}` : ''}</span>
    </div>
    <div class="brain-profile__grid">${rows}</div>
  </section>`
}
