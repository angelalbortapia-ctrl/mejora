import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { PREFIX, setItem } from '../js/core.js'
import {
  saveBiometricsEntry, getBiometricsEntry, computeCognitiveCorrelation,
} from '../js/modules/biometrics.js'

function clearMejora() {
  Object.keys(localStorage).filter(k => k.startsWith(PREFIX)).forEach(k => localStorage.removeItem(k))
}

describe('biometrics', () => {
  beforeEach(clearMejora)

  it('guarda y lee check-in diario', () => {
    saveBiometricsEntry({ sleepQuality: 4, energy: 5, hours: 7.5 }, '2026-09-10')
    const entry = getBiometricsEntry('2026-09-10')
    assert.equal(entry.sleepQuality, 4)
    assert.equal(entry.energy, 5)
    assert.equal(entry.hours, 7.5)
  })

  it('correlaciona biometría con precisión del laboratorio', () => {
    saveBiometricsEntry({ sleepQuality: 5, energy: 5 }, '2026-09-10')
    saveBiometricsEntry({ sleepQuality: 2, energy: 2 }, '2026-09-11')
    saveBiometricsEntry({ sleepQuality: 4, energy: 4 }, '2026-09-12')
    setItem('brainProtocolHistory', {
      stroop: [
        { date: '2026-09-10', metrics: { accuracy: 90 }, ts: 1 },
        { date: '2026-09-11', metrics: { accuracy: 60 }, ts: 2 },
        { date: '2026-09-12', metrics: { accuracy: 80 }, ts: 3 },
      ],
    })
    const corr = computeCognitiveCorrelation(30)
    assert.equal(corr.sampleSize, 3)
    assert.ok(corr.insight.length > 10)
    assert.ok(corr.energyR > 0.5)
  })
})
