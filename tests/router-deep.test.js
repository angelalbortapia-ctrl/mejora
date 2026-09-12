/**
 * Tests router — rutas anidadas
 */
import { parsePath, buildHash, navigate } from '../js/router.js'

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

test('parsePath lección escuela', () => {
  const p = parsePath('#/gimnasia/leccion/wm-ram')
  assert(p.path === '/gimnasia')
  assert(p.sub[0] === 'leccion')
  assert(p.sub[1] === 'wm-ram')
})

test('parsePath meditación sesión', () => {
  const p = parsePath('#/meditacion/sesion/breathing')
  assert(p.path === '/meditacion')
  assert(p.sub[0] === 'sesion')
})

test('buildHash anidado', () => {
  assert(buildHash('/gimnasia', 'leccion', 'wm-ram') === '#/gimnasia/leccion/wm-ram')
})

export { results }
