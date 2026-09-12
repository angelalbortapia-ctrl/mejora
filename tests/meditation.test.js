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

test('programas con camino diario completo', () => {
  assert(MEDITATION_PROGRAMS.length >= 4)
  assert(MEDITATION_PROGRAMS.every(p => p.schedule.length === p.days))
  assert(MEDITATION_PROGRAMS.every(p => p.dayPlan?.length === p.days))
  assert(MEDITATION_PROGRAMS.every(p => p.dayPlan.every(d => d.title && d.intention && d.intro)))
})

test('ids de programa resuelven sesiones', () => {
  for (const prog of MEDITATION_PROGRAMS) {
    for (const id of prog.schedule) {
      assert(MEDITATIONS.some(m => m.id === id), `missing session ${id} in ${prog.id}`)
    }
  }
})

export { results }
