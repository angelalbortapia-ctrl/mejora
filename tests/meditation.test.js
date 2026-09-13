/**
 * Tests meditación — programas y racha
 */
import { MEDITATIONS, MEDITATION_PROGRAMS } from '../js/meditations.js'
import { buildSessionPlan } from '../js/meditation-service.js'
import { enrichProgramSession } from '../js/meditation-program-content.js'

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

test('buildSessionPlan calibra duración con voz + práctica', () => {
  const silent = buildSessionPlan('body-scan', 'medio', false)
  const voiced = buildSessionPlan('body-scan', 'medio', true)
  assert(voiced.steps.length > 0)
  assert(voiced.totalSec >= silent.totalSec)
  voiced.steps.forEach((s, i) => {
    assert(s.duration >= 36, `step ${i} too short: ${s.duration}s`)
  })
})

test('enrichProgramSession añade contexto del día', () => {
  const base = [{ text: 'Respira.', voice: 'Tres respiraciones lentas.', duration: 40 }]
  const { intro, steps } = enrichProgramSession('calm-7', 1, 'Intro base', base)
  assert(intro.includes('Día uno') || intro.length > 8)
  assert(steps[0].voice.includes('Respiración consciente') || steps[0].voice.includes('Día 1'))
  assert(steps[0].text.length > 4)
})

const failed = results.filter(r => !r.ok)
if (failed.length) {
  failed.forEach(r => console.error(`✗ ${r.name}: ${r.error}`))
  throw new Error(`${failed.length} test(s) failed`)
}

export { results }
