/** Biometría diaria y correlación sueño/energía ↔ laboratorio cognitivo */

import { getItem, setItem, getToday, esc } from '/js/core.js'

const LOG_KEY = 'biometricsLog'

function mean(nums) {
  return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0
}

function pearson(xs, ys) {
  if (xs.length < 3 || ys.length < 3 || xs.length !== ys.length) return null
  const mx = mean(xs)
  const my = mean(ys)
  let num = 0
  let dx = 0
  let dy = 0
  for (let i = 0; i < xs.length; i++) {
    const x = xs[i] - mx
    const y = ys[i] - my
    num += x * y
    dx += x * x
    dy += y * y
  }
  const den = Math.sqrt(dx * dy)
  return den ? num / den : null
}

export function getBiometricsLog() {
  return getItem(LOG_KEY, {})
}

export function getBiometricsEntry(date = getToday()) {
  return getBiometricsLog()[date] || null
}

export function saveBiometricsEntry({ sleepQuality, energy, hours = null }, date = getToday()) {
  const log = getBiometricsLog()
  log[date] = {
    sleepQuality: clamp15(sleepQuality),
    energy: clamp15(energy),
    hours: hours == null || hours === '' ? null : Math.max(0, Math.min(24, Number(hours))),
    ts: Date.now(),
  }
  setItem(LOG_KEY, log)
  return log[date]
}

function clamp15(v) {
  const n = Number(v)
  if (!Number.isFinite(n)) return 3
  return Math.max(1, Math.min(5, Math.round(n)))
}

/** Promedio de precisión del laboratorio en una fecha (todas las sesiones del día). */
function dailyLabAccuracy(date) {
  const hist = getItem('brainProtocolHistory', {})
  const accs = []
  Object.values(hist).forEach(entries => {
    (entries || []).forEach(e => {
      if (e.date !== date) return
      const acc = e.metrics?.accuracy
      if (typeof acc === 'number') accs.push(acc)
    })
  })
  return accs.length ? mean(accs) : null
}

/**
 * Cruza biometría con historial clínico por fecha.
 * @returns {{ pairs, sleepR, energyR, insight, sampleSize }}
 */
export function computeCognitiveCorrelation(days = 30) {
  const log = getBiometricsLog()
  const dates = Object.keys(log).sort().slice(-days)
  const pairs = []

  dates.forEach(date => {
    const bio = log[date]
    const accuracy = dailyLabAccuracy(date)
    if (!bio || accuracy == null) return
    pairs.push({
      date,
      sleepQuality: bio.sleepQuality,
      energy: bio.energy,
      accuracy: Math.round(accuracy),
    })
  })

  const sleepR = pearson(pairs.map(p => p.sleepQuality), pairs.map(p => p.accuracy))
  const energyR = pearson(pairs.map(p => p.energy), pairs.map(p => p.accuracy))

  let insight = 'Registra sueño, energía y al menos una sesión del laboratorio en el mismo día para ver correlaciones.'
  if (pairs.length >= 3) {
    const highSleep = pairs.filter(p => p.sleepQuality >= 4)
    const lowSleep = pairs.filter(p => p.sleepQuality <= 2)
    const highAcc = highSleep.length ? Math.round(mean(highSleep.map(p => p.accuracy))) : null
    const lowAcc = lowSleep.length ? Math.round(mean(lowSleep.map(p => p.accuracy))) : null

    if (energyR != null && energyR >= 0.35) {
      insight = `Con más energía matutina sueles rendir mejor en el laboratorio (r≈${energyR.toFixed(2)}).`
    } else if (sleepR != null && sleepR >= 0.35) {
      insight = `Mejor descanso se asocia con mayor precisión en el lab (r≈${sleepR.toFixed(2)}).`
    } else if (highAcc != null && lowAcc != null && highAcc - lowAcc >= 8) {
      insight = `Tras noches de sueño ≥4/5 tu precisión media es ${highAcc}% vs ${lowAcc}% en noches ≤2/5.`
    } else if (pairs.length >= 5) {
      insight = 'Aún no hay un patrón claro — sigue registrando biometría y entrenando en el laboratorio.'
    } else {
      insight = `${pairs.length} días con datos pareados — necesitas un poco más de historial para ver tendencias.`
    }
  }

  return { pairs, sleepR, energyR, insight, sampleSize: pairs.length }
}

export function renderBiometricsCorrelationHTML() {
  const corr = computeCognitiveCorrelation(30)
  const today = getToday()
  const entry = getBiometricsEntry(today)
  const recent = corr.pairs.slice(-7)

  const bars = recent.length
    ? recent.map(p => `
        <div class="flex justify-between text-sm py-1 border-b border-white/5" title="${esc(p.date)}">
          <span class="text-muted tabular-nums">${p.date.slice(5)}</span>
          <span>😴 ${p.sleepQuality}</span>
          <span>⚡ ${p.energy}</span>
          <span class="tabular-nums font-medium">${p.accuracy}%</span>
        </div>`).join('')
    : '<p class="text-sm text-muted">Sin días con laboratorio + biometría aún.</p>'

  return `<div class="card card-static viaje-biometrics span-full" id="viaje-biometrics-card">
    <h3 class="section-title">Sueño, energía y laboratorio</h3>
    <p class="text-sm text-muted mb-3">Correlaciona tu descanso con la precisión cognitiva del día.</p>
    <form class="bio-checkin-form" onsubmit="saveBiometricsCheckin(event)">
      <div class="grid gap-3 sm:grid-cols-3">
        <label class="block">
          <span class="text-xs text-muted">Calidad de sueño</span>
          <input type="range" name="sleepQuality" min="1" max="5" step="1" value="${entry?.sleepQuality ?? 3}" class="w-full" oninput="this.nextElementSibling.textContent=this.value+'/5'">
          <span class="text-sm text-main tabular-nums">${entry?.sleepQuality ?? 3}/5</span>
        </label>
        <label class="block">
          <span class="text-xs text-muted">Energía al despertar</span>
          <input type="range" name="energy" min="1" max="5" step="1" value="${entry?.energy ?? 3}" class="w-full" oninput="this.nextElementSibling.textContent=this.value+'/5'">
          <span class="text-sm text-main tabular-nums">${entry?.energy ?? 3}/5</span>
        </label>
        <label class="block">
          <span class="text-xs text-muted">Horas (opcional)</span>
          <input type="number" name="hours" min="0" max="24" step="0.5" class="input-field" placeholder="7.5" value="${entry?.hours ?? ''}">
        </label>
      </div>
      <button type="submit" class="btn-secondary w-full mt-2">Guardar check-in de hoy</button>
    </form>
    <div class="bio-corr-insight mt-4">
      <p class="text-sm text-main leading-relaxed">${esc(corr.insight)}</p>
      ${corr.sampleSize ? `<p class="text-xs text-muted mt-1">${corr.sampleSize} día(s) con datos · ${corr.energyR != null ? `energía r=${corr.energyR.toFixed(2)}` : ''}${corr.sleepR != null ? ` · sueño r=${corr.sleepR.toFixed(2)}` : ''}</p>` : ''}
    </div>
    <div class="bio-corr-recent mt-3">${bars}</div>
  </div>`
}

export function bindBiometricsGlobals() {
  window.saveBiometricsCheckin = (ev) => {
    ev?.preventDefault?.()
    const form = ev?.target || document.querySelector('.bio-checkin-form')
    if (!form) return
    const sleepQuality = form.sleepQuality?.value
    const energy = form.energy?.value
    const hours = form.hours?.value
    saveBiometricsEntry({ sleepQuality, energy, hours })
    const card = document.getElementById('viaje-biometrics-card')
    if (card) {
      const msg = document.createElement('p')
      msg.className = 'text-xs text-muted mt-2'
      msg.textContent = '✓ Check-in guardado'
      card.appendChild(msg)
      setTimeout(() => msg.remove(), 2000)
    }
    window.render?.()
  }
}
