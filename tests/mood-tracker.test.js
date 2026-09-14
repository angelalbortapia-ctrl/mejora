import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { PREFIX, getToday } from '../js/core.js'
import {
  saveMicroJournal, hasMicroJournalToday, shouldShowMicroJournal, getMicroJournalToday,
} from '../js/modules/mood-tracker.js'

function clearMejora() {
  Object.keys(localStorage).filter(k => k.startsWith(PREFIX)).forEach(k => localStorage.removeItem(k))
}

describe('mood-tracker', () => {
  beforeEach(clearMejora)

  it('shouldShowMicroJournal es true hasta registrar', () => {
    assert.equal(shouldShowMicroJournal('calma'), true)
    assert.equal(shouldShowMicroJournal('routine'), true)
  })

  it('guarda micro-registro por fuente y fecha', () => {
    const entry = saveMicroJournal({ source: 'calma', moodId: 3, clarity: 4, note: 'Más claro' })
    assert.equal(entry.moodId, 3)
    assert.equal(entry.clarity, 4)
    assert.equal(hasMicroJournalToday('calma'), true)
    assert.equal(shouldShowMicroJournal('calma'), false)
    assert.equal(shouldShowMicroJournal('routine'), true)
    assert.equal(getMicroJournalToday('calma').note, 'Más claro')
    assert.equal(getMicroJournalToday('calma').date, getToday())
  })
})
