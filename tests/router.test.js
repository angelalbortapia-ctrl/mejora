/**
 * Tests para router.js
 */
import {
  parsePath, scheduleRender, bindRender, getLastRenderPath, setLastRenderPath,
} from '../js/router.js'

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

test('parsePath raíz', () => {
  assert(parsePath('').path === '/')
  assert(parsePath('#/').path === '/')
})

test('parsePath segmento', () => {
  const p = parsePath('#/plan')
  assert(p.path === '/plan')
  assert(p.parts[0] === 'plan')
})

test('parsePath anidado mejora/diario', () => {
  const p = parsePath('#/mejora/diario/weekly')
  assert(p.path === '/mejora')
  assert(p.parts[1] === 'diario')
  assert(p.parts[2] === 'weekly')
})

test('lastRenderPath get/set', () => {
  setLastRenderPath('/gimnasia')
  assert(getLastRenderPath() === '/gimnasia')
  setLastRenderPath('/')
})

test('scheduleRender debounce', async () => {
  let count = 0
  bindRender(() => { count++ })
  scheduleRender()
  scheduleRender()
  scheduleRender()
  await new Promise(r => setTimeout(r, 80))
  assert(count === 1, `expected 1 render, got ${count}`)
})

test('scheduleRender immediate', () => {
  let count = 0
  bindRender(() => { count++ })
  scheduleRender(true)
  scheduleRender(true)
  assert(count === 2, `expected 2 immediate renders, got ${count}`)
})

export { results }
