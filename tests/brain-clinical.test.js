import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  createTrialLog, logTrial, beginScoredBlock, computeMetrics, computeStroopMetrics,
  computeWisconsinMetrics, saveProtocolResult, getProtocolHistory, interpretVsHistory,
  hasSeenProtocolBrief, markProtocolBriefSeen, getClinicalReportExportPayload,
  PRACTICE_TRIALS, isPractice,
} from '../js/brain-metrics.js'
import { initWisconsin } from '../js/brain-exercises.js'
import { CLINICAL_PROTOCOLS, prepareClinicalState, completeClinicalReport } from '../js/brain-clinical-lab.js'
import { initStroop, initNBack, initFlanker } from '../js/brain-exercises.js'
import { CASUAL_EXERCISE_IDS } from '../js/brain-program.js'

describe('brain-clinical — práctica y bloque evaluado', () => {
  it('beginScoredBlock resetea score y trials numéricos', () => {
    const s = { clinicalBlock: 'practice', score: 3, trials: 3, flash: 'ok' }
    beginScoredBlock(s)
    assert.equal(s.clinicalBlock, 'scored')
    assert.equal(s.score, 0)
    assert.equal(s.trials, 0)
    assert.equal(s.flash, null)
  })

  it('prepareClinicalState inicia bloque de práctica', () => {
    const s = prepareClinicalState({})
    assert.equal(s.clinicalBlock, 'practice')
    assert.equal(s.practiceIdx, 0)
    assert.ok(s.trialLog)
  })

  it('isPractice detecta bloque de práctica', () => {
    assert.equal(isPractice({ clinicalBlock: 'practice' }), true)
    assert.equal(isPractice({ clinicalBlock: 'scored' }), false)
  })
})

describe('brain-clinical — métricas e historial', () => {
  it('computeStroopMetrics calcula precisión y coste', () => {
    const log = createTrialLog()
    log.scored = [
      { correct: true, congruent: true, rt: 400 },
      { correct: true, congruent: false, rt: 600 },
      { correct: false, congruent: false, rt: 700 },
    ]
    const m = computeStroopMetrics(log)
    assert.equal(m.accuracy, 67)
    assert.ok(m.conflictCost >= 0)
    assert.ok(m.rows.length >= 3)
  })

  it('interpretVsHistory compara con sesiones previas', () => {
    const history = [
      { metrics: { accuracy: 80 } },
      { metrics: { accuracy: 70 } },
      { metrics: { accuracy: 75 } },
    ]
    const interp = interpretVsHistory({ accuracy: 85 }, history)
    assert.match(interp.text, /encima|estable|promedio/i)
    assert.equal(typeof interp.delta, 'number')
  })

  it('saveProtocolResult persiste historial por protocolo', () => {
    const metrics = { accuracy: 90, rows: [] }
    saveProtocolResult('stroop-test', metrics)
    const hist = getProtocolHistory('stroop-test')
    assert.ok(hist.length >= 1)
    assert.equal(hist[0].metrics.accuracy, 90)
  })
})

describe('brain-clinical — briefing visto', () => {
  it('marca y detecta protocolos vistos', () => {
    assert.equal(hasSeenProtocolBrief('stroop'), false)
    markProtocolBriefSeen('stroop')
    assert.equal(hasSeenProtocolBrief('stroop'), true)
  })
})

describe('brain-clinical — flujo stroop simulado', () => {
  it('práctica → evaluado → métricas sin crash', () => {
    const s = prepareClinicalState(initStroop(6, 'medio'))
    s.practiceTrials = s.trials.slice(0, PRACTICE_TRIALS)
    for (let i = 0; i < PRACTICE_TRIALS; i++) {
      const t = s.practiceTrials[i]
      logTrial(s.trialLog, { correct: true, congruent: t.congruent, rt: 500 }, true)
      s.practiceIdx = i + 1
    }
    beginScoredBlock(s)
    s.index = 0
    for (let i = 0; i < s.total; i++) {
      const t = s.trials[i]
      logTrial(s.trialLog, { correct: true, congruent: t.congruent, rt: 450 }, false)
    }
    const metrics = computeMetrics('stroop', s.trialLog, s)
    assert.equal(metrics.accuracy, 100)
    assert.equal(s.trialLog.scored.length, s.total)
    assert.equal(s.trialLog.practice.length, PRACTICE_TRIALS)
  })
})

describe('brain-clinical — flujo n-back simulado', () => {
  it('práctica no contamina score del bloque evaluado', () => {
    const s = prepareClinicalState(initNBack(1, 8, 'medio'))
    s.score = 2
    beginScoredBlock(s)
    assert.equal(s.score, 0)
    assert.equal(s.trials, 0)
  })
})

describe('brain-clinical — completeClinicalReport', () => {
  it('no lanza al completar stroop', () => {
    const s = prepareClinicalState(initStroop(4, 'medio'))
    const log = s.trialLog
    s.trials.forEach(t => logTrial(log, { correct: true, congruent: t.congruent, rt: 400 }, false))
    let rendered = false
    completeClinicalReport('stroop', s, () => { rendered = true })
    assert.equal(s.finished, true)
    assert.equal(s.reportPhase, true)
    assert.ok(s.metrics)
    assert.equal(rendered, true)
  })
})

describe('brain-clinical — taxonomía catálogo', () => {
  it('protocolos clínicos y casuales están definidos', () => {
    assert.ok(CLINICAL_PROTOCOLS.has('stroop'))
    assert.ok(CLINICAL_PROTOCOLS.has('wisconsin'))
    assert.ok(CASUAL_EXERCISE_IDS.has('math'))
    assert.ok(CASUAL_EXERCISE_IDS.has('anagram'))
    assert.equal(CLINICAL_PROTOCOLS.has('math'), false)
  })
})

describe('brain-clinical — wisconsin, trail, ant', () => {
  it('wisconsin métricas usan index como trials', () => {
    const m = computeWisconsinMetrics({ index: 12, categories: 2, perseverative: 3 })
    assert.equal(m.rows.find(r => r.label === 'Trials')?.value, '12')
  })

  it('flujo wisconsin práctica → evaluado', () => {
    const s = prepareClinicalState(initWisconsin('medio'))
    for (let i = 0; i < PRACTICE_TRIALS; i++) {
      logTrial(s.trialLog, { correct: true }, true)
      s.index++
    }
    beginScoredBlock(s)
    s.index = 0
    assert.equal(s.score, 0)
    assert.equal(s.clinicalBlock, 'scored')
  })
})

describe('brain-clinical — export PDF payload', () => {
  it('getClinicalReportExportPayload incluye nombre e interpretación', () => {
    const payload = getClinicalReportExportPayload('stroop', { accuracy: 88, rows: [] }, [
      { date: '2026-09-13', metrics: { accuracy: 88 } },
      { date: '2026-09-12', metrics: { accuracy: 75 } },
    ])
    assert.equal(payload.exerciseName, 'Stroop')
    assert.ok(payload.interpretation)
  })
})

describe('brain-clinical — flanker y cpt métricas', () => {
  it('computeMetrics devuelve filas para flanker', () => {
    const log = createTrialLog()
    log.scored = [
      { correct: true, congruent: true, rt: 380 },
      { correct: true, congruent: false, rt: 520 },
    ]
    const m = computeMetrics('flanker', log, {})
    assert.ok(m.accuracy >= 0)
    assert.ok(m.rows.length > 0)
  })

  it('computeMetrics devuelve filas para cpt', () => {
    const log = createTrialLog()
    log.scored = [
      { correct: true, type: 'hit', isTarget: true },
      { correct: false, type: 'miss', isTarget: true },
    ]
    const m = computeMetrics('cpt', log, { hits: 1, misses: 1, falseAlarms: 0 })
    assert.ok(m.rows.length > 0)
  })
})
