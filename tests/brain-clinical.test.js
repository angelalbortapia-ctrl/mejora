import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  createTrialLog, logTrial, beginScoredBlock, computeMetrics, computeStroopMetrics,
  computeWisconsinMetrics, computeTrailMetrics, computeANTMetrics, computeGoNoGoMetrics,
  computeCPTMetrics, saveProtocolResult, getProtocolHistory, interpretVsHistory,
  generateMicroFeedback, METRIC_GLOSSARY,
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

describe('brain-clinical — OOP protocols', () => {
  it('StroopProtocol extiende BaseProtocol', async () => {
    const { BaseProtocol } = await import('../js/pages/brain-gym/base-protocol.js')
    const { StroopProtocol } = await import('../js/pages/brain-gym/protocols/stroop.js')
    const p = new StroopProtocol()
    assert.ok(p instanceof BaseProtocol)
    assert.equal(p.id, 'stroop')
    assert.equal(p.clinical, true)
  })

  it('FlankerProtocol extiende BaseProtocol', async () => {
    const { BaseProtocol } = await import('../js/pages/brain-gym/base-protocol.js')
    const { FlankerProtocol } = await import('../js/pages/brain-gym/protocols/flanker.js')
    const p = new FlankerProtocol()
    assert.ok(p instanceof BaseProtocol)
    assert.equal(p.id, 'flanker')
  })
})

describe('brain-clinical — briefing visto', () => {
  it('marca y detecta protocolos vistos', () => {
    assert.equal(hasSeenProtocolBrief('stroop'), false)
    markProtocolBriefSeen('stroop')
    assert.equal(hasSeenProtocolBrief('stroop'), true)
  })

  it('persiste en mejora_briefing_[protocolId]', () => {
    markProtocolBriefSeen('nback-test-key')
    assert.ok(localStorage.getItem('mejora_briefing_nback-test-key'))
    assert.equal(hasSeenProtocolBrief('nback-test-key'), true)
    localStorage.removeItem('mejora_briefing_nback-test-key')
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
    const s = prepareClinicalState(initWisconsin(12, 'medio'))
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

describe('brain-clinical — trail, ant, gonogo métricas', () => {
  it('computeTrailMetrics penaliza errores', () => {
    const perfect = computeTrailMetrics({ elapsedMs: 45000, errors: 0, variant: 'A' })
    const flawed = computeTrailMetrics({ elapsedMs: 50000, errors: 3, variant: 'B' })
    assert.equal(perfect.accuracy, 100)
    assert.ok(flawed.accuracy < perfect.accuracy)
    assert.equal(perfect.rows.find(r => r.label === 'Tiempo')?.value, '45.0s')
  })

  it('computeANTMetrics calcula alert cost', () => {
    const log = createTrialLog()
    log.scored = [
      { correct: true, cue: 'none', rt: 500 },
      { correct: true, cue: 'center', rt: 620 },
      { correct: true, cue: 'spatial', rt: 480 },
    ]
    const m = computeANTMetrics(log)
    assert.equal(m.accuracy, 100)
    assert.ok(m.rows.some(r => r.label.includes('Alerta')))
  })

  it('computeGoNoGoMetrics cuenta comisiones', () => {
    const log = createTrialLog()
    log.scored = [
      { type: 'go_hit', correct: true },
      { type: 'commission', correct: false },
      { type: 'go_hit', correct: true },
    ]
    const m = computeGoNoGoMetrics(log, { score: 2, total: 3 })
    assert.equal(m.rows.find(r => r.label === 'Comisiones')?.value, '1')
    assert.equal(m.accuracy, 67)
  })
})

describe('brain-clinical — micro-feedback NLP', () => {
  it('generateMicroFeedback detecta mejora de precisión', () => {
    const text = generateMicroFeedback('stroop', { accuracy: 90 }, [
      { metrics: { accuracy: 90 } },
      { metrics: { accuracy: 70 } },
    ])
    assert.match(text, /precisión|mejora|salto/i)
  })

  it('METRIC_GLOSSARY define términos clave', () => {
    assert.ok(METRIC_GLOSSARY["d′ (d-prime)"])
    assert.ok(METRIC_GLOSSARY['Falsas alarmas'])
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
