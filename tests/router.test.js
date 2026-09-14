/**
 * Tests para router.js
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  parsePath, scheduleRender, bindRender, getLastRenderPath, setLastRenderPath, resetRouterForTests,
} from '../js/router.js'

describe('router', () => {
  it('parsePath raíz', () => {
    assert.equal(parsePath('').path, '/')
    assert.equal(parsePath('#/').path, '/')
  })

  it('parsePath segmento', () => {
    const p = parsePath('#/plan')
    assert.equal(p.path, '/plan')
    assert.equal(p.parts[0], 'plan')
  })

  it('parsePath anidado mejora (segmentos extra ignorados en ruta)', () => {
    const p = parsePath('#/mejora/extra/segment')
    assert.equal(p.path, '/mejora')
    assert.equal(p.parts[1], 'extra')
    assert.equal(p.parts[2], 'segment')
  })

  it('lastRenderPath get/set', () => {
    setLastRenderPath('/gimnasia')
    assert.equal(getLastRenderPath(), '/gimnasia')
    setLastRenderPath('/')
  })

  it('scheduleRender debounce', async () => {
    resetRouterForTests()
    let count = 0
    bindRender(() => { count++ })
    scheduleRender()
    scheduleRender()
    scheduleRender()
    await new Promise(r => setTimeout(r, 120))
    assert.equal(count, 1)
    resetRouterForTests()
  })

  it('scheduleRender immediate', () => {
    resetRouterForTests()
    let count = 0
    bindRender(() => { count++ })
    scheduleRender(true)
    scheduleRender(true)
    assert.equal(count, 2)
    resetRouterForTests()
  })
})
