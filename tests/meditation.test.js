/**
 * Tests meditación — programas y racha
 */
import { MEDITATIONS, MEDITATION_PROGRAMS } from '../js/meditations.js'

const results = []

function test(name, fn) {
  try {
    fn()
    results.push({ name, ok: true })
  } catch (e) {
    results.push({ name, ok: false, error: e.message })
  }
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg || 'Assertion failed')
}

test('14 sesiones de meditación', () => {
  assert(MEDITATIONS.length >= 14, `expected >=14, got ${MEDITATIONS.length}`)
})

test('programas 7/21/30 días', () => {
  assert(MEDITATION_PROGRAMS.length === 3)
  assert(MEDITATION_PROGRAMS.every(p => p.schedule.length >= p.days))
})

test('ids de programa resuelven sesiones', () => {
  for (const prog of MEDITATION_PROGRAMS) {
    for (const id of prog.schedule) {
      assert(MEDITATIONS.some(m => m.id === id), `missing session ${id} in ${prog.id}`)
    }
  }
})

export { results }
