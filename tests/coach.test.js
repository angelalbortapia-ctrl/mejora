import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { getWeeklyReviewSuggestion } from '../js/coach-engine.js'

describe('coach-engine', () => {
  it('sugiere calma cuando la nota menciona estrés', () => {
    const s = getWeeklyReviewSuggestion('Tuve mucho estrés en el trabajo')
    assert.match(s.desc, /estrés|antiestrés|calma|carga emocional/i)
  })

  it('devuelve acción por defecto sin nota', () => {
    const s = getWeeklyReviewSuggestion('')
    assert.ok(s.link)
    assert.ok(s.cta)
  })
})
