/** Métricas clínicas, historial y UI de informes — laboratorio cognitivo */

import { getItem, setItem, getToday, esc } from '/js/core.js'

export const PRACTICE_TRIALS = 3
const HISTORY_KEY = 'brainProtocolHistory'
const MAX_HISTORY = 10

export function createTrialLog() {
  return { practice: [], scored: [] }
}

export function logTrial(log, entry, isPractice = false) {
  if (!log) return
  const bucket = isPractice ? log.practice : log.scored
  bucket.push({ ...entry, at: Date.now() })
}

function mean(arr) {
  return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0
}

function hautus(p) {
  const n = Math.max(0.01, Math.min(0.99, p))
  return n
}

function zScore(p) {
  const v = hautus(p)
  // Aproximación rápida inversa normal
  const a = [2.515517, 0.802853, 0.010328]
  const b = [1.432788, 0.189269, 0.001308]
  const t = v < 0.5 ? Math.sqrt(-2 * Math.log(v)) : Math.sqrt(-2 * Math.log(1 - v))
  const num = a[0] + a[1] * t + a[2] * t * t
  const den = 1 + b[0] * t + b[1] * t * t + b[2] * t * t * t
  const z = num / den
  return v < 0.5 ? -z : z
}

export function computeDPrime(hits, misses, falseAlarms, totalNonTargets) {
  const hitRate = hits + misses > 0 ? hits / (hits + misses) : 0
  const faRate = totalNonTargets > 0 ? falseAlarms / totalNonTargets : 0
  return zScore(hitRate) - zScore(faRate)
}

function rtStats(trials) {
  const rts = trials.filter(t => t.correct && t.rt > 0).map(t => t.rt)
  return { avg: Math.round(mean(rts)), n: rts.length }
}

export function computeStroopMetrics(log) {
  const t = log.scored
  const congruent = t.filter(x => x.congruent)
  const incongruent = t.filter(x => !x.congruent)
  const acc = t.length ? Math.round(t.filter(x => x.correct).length / t.length * 100) : 0
  const rtC = rtStats(congruent)
  const rtI = rtStats(incongruent)
  const conflictCost = rtC.avg && rtI.avg ? rtI.avg - rtC.avg : null
  return {
    accuracy: acc,
    conflictCost,
    rtCongruent: rtC.avg,
    rtIncongruent: rtI.avg,
    trials: t.length,
    rows: [
      { label: 'Precisión global', value: `${acc}%`, hint: 'Meta clínica habitual >85%' },
      { label: 'RT congruentes', value: rtC.avg ? `${rtC.avg} ms` : '—', hint: 'Respuesta automática' },
      { label: 'RT incongruentes', value: rtI.avg ? `${rtI.avg} ms` : '—', hint: 'Conflicto cognitivo' },
      { label: 'Coste Stroop', value: conflictCost != null ? `+${conflictCost} ms` : '—', hint: 'Diferencia incongruente − congruente' },
    ],
  }
}

export function computeFlankerMetrics(log) {
  const t = log.scored
  const congruent = t.filter(x => x.congruent)
  const incongruent = t.filter(x => !x.congruent)
  const acc = t.length ? Math.round(t.filter(x => x.correct).length / t.length * 100) : 0
  const rtC = rtStats(congruent)
  const rtI = rtStats(incongruent)
  const interference = rtC.avg && rtI.avg ? rtI.avg - rtC.avg : null
  return {
    accuracy: acc,
    interference,
    rows: [
      { label: 'Precisión', value: `${acc}%` },
      { label: 'Interferencia', value: interference != null ? `+${interference} ms` : '—', hint: 'Coste de distractores' },
      { label: 'RT alineadas', value: rtC.avg ? `${rtC.avg} ms` : '—' },
      { label: 'RT conflicto', value: rtI.avg ? `${rtI.avg} ms` : '—' },
    ],
  }
}

export function computeCPTMetrics(log, state) {
  const hits = state?.hits ?? 0
  const misses = state?.misses ?? 0
  const fa = state?.falseAlarms ?? 0
  const targets = (state?.trials || []).filter(t => t.isTarget).length
  const nonTargets = (state?.total || 0) - targets
  const dPrime = computeDPrime(hits, misses, fa, nonTargets)
  const vigilance = targets ? Math.round(hits / targets * 100) : 0
  return {
    accuracy: vigilance,
    dPrime: Math.round(dPrime * 100) / 100,
    rows: [
      { label: 'Aciertos (hits)', value: `${hits}/${targets}` },
      { label: 'Omisiones', value: String(misses), hint: 'X no detectada' },
      { label: 'Falsas alarmas', value: String(fa), hint: 'Responder a no-X' },
      { label: 'd′ (sensibilidad)', value: dPrime.toFixed(2), hint: '>1.5 bueno · >2 excelente' },
    ],
  }
}

export function computeNBackMetrics(log, state) {
  const t = log.scored
  const hits = t.filter(x => x.type === 'hit').length
  const misses = t.filter(x => x.type === 'miss').length
  const fa = t.filter(x => x.type === 'fa').length
  const correct = t.filter(x => x.correct).length
  const acc = t.length ? Math.round(correct / t.length * 100) : 0
  return {
    accuracy: acc,
    n: state?.n,
    rows: [
      { label: 'Nivel N', value: String(state?.n ?? '—') },
      { label: 'Precisión', value: `${acc}%` },
      { label: 'Aciertos', value: String(hits) },
      { label: 'Omisiones', value: String(misses), hint: 'Match no marcado' },
      { label: 'Falsas alarmas', value: String(fa), hint: 'Marcado sin match' },
    ],
  }
}

export function computeGoNoGoMetrics(log, state) {
  const t = log.scored
  const commissions = t.filter(x => x.type === 'commission').length
  const goOk = t.filter(x => x.type === 'go_hit').length
  const acc = state?.total ? Math.round((state.score || 0) / state.total * 100) : 0
  return {
    accuracy: acc,
    rows: [
      { label: 'Go correctos', value: String(goOk) },
      { label: 'Comisiones', value: String(commissions), hint: 'Tocar en No-Go' },
      { label: 'Precisión global', value: `${acc}%` },
    ],
  }
}

export function computeSpanMetrics(state, label = 'Span') {
  return {
    accuracy: state?.score ? Math.min(100, state.score * 15) : 0,
    rows: [
      { label: label, value: String(state?.length ?? state?.level ?? '—') },
      { label: 'Secuencias', value: String(state?.score ?? 0) },
    ],
  }
}

export function computeTrailMetrics(state) {
  const timeSec = state?.elapsedMs ? (state.elapsedMs / 1000).toFixed(1) : '—'
  const errors = state?.errors ?? 0
  return {
    accuracy: errors === 0 ? 100 : Math.max(0, 100 - errors * 8),
    rows: [
      { label: 'Tiempo', value: `${timeSec}s` },
      { label: 'Errores', value: String(errors) },
      { label: 'Variante', value: state?.variant === 'B' ? 'TMT-B' : 'TMT-A' },
    ],
  }
}

export function computeWisconsinMetrics(state) {
  return {
    accuracy: state?.categories ? Math.round(state.categories / 3 * 100) : 0,
    rows: [
      { label: 'Categorías', value: `${state?.categories ?? 0}/3` },
      { label: 'Errores perseveración', value: String(state?.perseverative ?? 0) },
      { label: 'Trials', value: String(state?.index ?? 0) },
    ],
  }
}

export function computeANTMetrics(log) {
  const t = log.scored
  const acc = t.length ? Math.round(t.filter(x => x.correct).length / t.length * 100) : 0
  const byCue = { none: [], center: [], spatial: [] }
  t.forEach(x => { if (byCue[x.cue]) byCue[x.cue].push(x) })
  const alertCost = rtStats(byCue.none).avg && rtStats(byCue.center).avg
    ? rtStats(byCue.center).avg - rtStats(byCue.none).avg : null
  return {
    accuracy: acc,
    rows: [
      { label: 'Precisión', value: `${acc}%` },
      { label: 'Alerta (centro−ninguna)', value: alertCost != null ? `${alertCost} ms` : '—' },
      { label: 'Trials', value: String(t.length) },
    ],
  }
}

export function computeMetrics(exerciseId, log, state) {
  if (!log) return { accuracy: 0, rows: [] }
  switch (exerciseId) {
    case 'stroop': return computeStroopMetrics(log)
    case 'flanker': return computeFlankerMetrics(log)
    case 'cpt': return computeCPTMetrics(log, state)
    case 'nback': return computeNBackMetrics(log, state)
    case 'dualnback': return computeNBackMetrics(log, state)
    case 'visnback': return computeNBackMetrics(log, state)
    case 'gonogo': return computeGoNoGoMetrics(log, state)
    case 'revspan': return computeSpanMetrics(state, 'Techo dígitos')
    case 'corsi': return computeSpanMetrics(state, 'Span espacial')
    case 'trail': return computeTrailMetrics(state)
    case 'wisconsin': return computeWisconsinMetrics(state)
    case 'ant': return computeANTMetrics(log)
    default: {
      const acc = state?.score && state?.total
        ? Math.round(state.score / state.total * 100)
        : 0
      return {
        accuracy: acc,
        rows: [{ label: 'Precisión', value: `${acc}%` }, { label: 'Puntuación', value: `${state?.score ?? 0}/${state?.total ?? 0}` }],
      }
    }
  }
}

export function saveProtocolResult(exerciseId, metrics) {
  const hist = getItem(HISTORY_KEY, {})
  if (!hist[exerciseId]) hist[exerciseId] = []
  const entry = { date: getToday(), metrics, ts: Date.now() }
  hist[exerciseId].unshift(entry)
  hist[exerciseId] = hist[exerciseId].slice(0, MAX_HISTORY)
  setItem(HISTORY_KEY, hist)
  return entry
}

export function getProtocolHistory(exerciseId) {
  return getItem(HISTORY_KEY, {})[exerciseId] || []
}

export function getProtocolBest(exerciseId) {
  const hist = getProtocolHistory(exerciseId)
  if (!hist.length) return null
  return hist.reduce((best, h) => (h.metrics?.accuracy > (best?.metrics?.accuracy ?? 0) ? h : best), hist[0])
}

export function attachClinical(state) {
  if (!state.trialLog) state.trialLog = createTrialLog()
  if (!state.clinicalBlock) state.clinicalBlock = 'idle'
  if (state.practiceLeft == null) state.practiceLeft = PRACTICE_TRIALS
  return state
}

export function isPractice(state) {
  return state?.clinicalBlock === 'practice'
}

export function onPracticeTrialDone(state) {
  if (state.clinicalBlock !== 'practice') return false
  state.practiceLeft = (state.practiceLeft ?? PRACTICE_TRIALS) - 1
  return state.practiceLeft <= 0
}

export function beginScoredBlock(state) {
  state.clinicalBlock = 'scored'
  state.flash = null
  state.score = 0
  if (typeof state.trials === 'number') state.trials = 0
}

export function renderPracticeBanner(state) {
  if (state?.clinicalBlock !== 'practice') return ''
  const cur = (state.practiceIdx ?? state.index ?? 0) + 1
  return `<div class="brain-practice-banner" role="status">
    <span class="brain-practice-banner__tag">Práctica</span>
    <span>${cur} / ${PRACTICE_TRIALS} · no cuenta en el informe</span>
  </div>`
}

export function renderTrialFlash(state) {
  if (!state?.flash) return ''
  const ok = state.flash === 'ok'
  return `<div class="brain-trial-flash brain-trial-flash--${ok ? 'ok' : 'bad'}" aria-hidden="true">${ok ? '✓' : '✗'}</div>`
}

export function renderPaceRing(pct) {
  const p = Math.max(0, Math.min(100, pct))
  const r = 42
  const c = 2 * Math.PI * r
  const off = c * (1 - p / 100)
  return `<svg class="brain-pace-ring" viewBox="0 0 96 96" aria-hidden="true">
    <circle class="brain-pace-ring__track" cx="48" cy="48" r="${r}"/>
    <circle class="brain-pace-ring__fill" cx="48" cy="48" r="${r}"
      style="stroke-dasharray:${c};stroke-dashoffset:${off}"/>
  </svg>`
}

export function renderClinicalReport(exerciseId, metrics, finishBtnHtml, history = []) {
  const best = history.length
    ? history.reduce((b, h) => (h.metrics?.accuracy > (b?.metrics?.accuracy ?? 0) ? h : b), history[0])
    : null
  const trend = history.slice(0, 5).map(h => h.metrics?.accuracy ?? 0)
  const trendBars = trend.length > 1
    ? `<div class="brain-report-trend">${trend.map((v, i) =>
      `<div class="brain-report-trend__bar" style="height:${Math.max(8, v)}%" title="${history[i]?.date}: ${v}%"><span>${v}%</span></div>`
    ).join('')}</div>`
    : '<p class="brain-report-trend-empty">Primera sesión registrada — sigue entrenando para ver tendencia.</p>'

  return `<div class="brain-clinical-report">
    <header class="brain-clinical-report__head">
      <p class="brain-clinical-report__kicker">Informe de protocolo</p>
      <p class="brain-clinical-report__score">${metrics.accuracy}%</p>
      ${best && best.metrics?.accuracy > metrics.accuracy
        ? `<p class="brain-clinical-report__record">Récord: ${best.metrics.accuracy}% (${best.date})</p>`
        : best ? '<p class="brain-clinical-report__record">¡Nuevo récord personal!</p>' : ''}
    </header>
    <table class="brain-clinical-report__table">
      <tbody>${(metrics.rows || []).map(r => `<tr>
        <th>${esc(r.label)}</th>
        <td><strong>${esc(r.value)}</strong>${r.hint ? `<span class="brain-clinical-report__hint">${esc(r.hint)}</span>` : ''}</td>
      </tr>`).join('')}</tbody>
    </table>
    <section class="brain-clinical-report__trend">
      <h4>Últimas sesiones</h4>
      ${trendBars}
    </section>
    ${finishBtnHtml}
  </div>`
}

export function analyzeSessionResults(results) {
  if (!results?.length) return { weakest: null, strongest: null, tip: '' }
  const sorted = [...results].sort((a, b) => (a.accuracy ?? 0) - (b.accuracy ?? 0))
  const weakest = sorted[0]
  const strongest = sorted[sorted.length - 1]
  const tip = weakest?.accuracy < 0.6
    ? `Tu cuello de botella hoy fue ${weakest.name} (${Math.round(weakest.accuracy * 100)}%). Repite ese protocolo mañana.`
    : 'Sesión equilibrada. Mantén 3× por semana para consolidar.'
  return { weakest, strongest, tip }
}
