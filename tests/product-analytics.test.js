import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { PREFIX, setItem } from '../js/core.js'
import {
  trackProductEvent, EVENTS, getProductAnalyticsSummary, countEventsByName,
} from '../js/product-analytics.js'

function clearStorage() {
  Object.keys(localStorage).filter(k => k.startsWith(PREFIX)).forEach(k => localStorage.removeItem(k))
}

describe('product-analytics', () => {
  beforeEach(clearStorage)

  it('registra y resume eventos', () => {
    trackProductEvent(EVENTS.HABIT_COMPLETE, { habitId: 'water' })
    trackProductEvent(EVENTS.SHARE, { kind: 'journey' })
    const summary = getProductAnalyticsSummary()
    assert.equal(summary.total, 2)
    assert.equal(summary.funnel30.habits, 1)
    assert.equal(summary.funnel30.shares, 1)
  })

  it('countEventsByName agrupa correctamente', () => {
    trackProductEvent(EVENTS.BRAIN_SESSION)
    trackProductEvent(EVENTS.BRAIN_SESSION)
    const counts = countEventsByName([
      { name: EVENTS.BRAIN_SESSION },
      { name: EVENTS.BRAIN_SESSION },
      { name: EVENTS.APP_OPEN },
    ])
    assert.equal(counts[EVENTS.BRAIN_SESSION], 2)
    assert.equal(counts[EVENTS.APP_OPEN], 1)
  })
})
