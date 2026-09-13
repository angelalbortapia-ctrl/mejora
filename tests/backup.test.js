import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { PREFIX, setItem } from '../js/core.js'
import { exportAllData } from '../js/backup.js'

function clearStorage() {
  Object.keys(localStorage).filter(k => k.startsWith(PREFIX)).forEach(k => localStorage.removeItem(k))
}

describe('exportAllData', () => {
  beforeEach(clearStorage)

  it('exporta claves con prefijo mejora_', () => {
    setItem('settings', { sound: true })
    setItem('stats', { habitsCompleted: 3 })
    const data = exportAllData()
    assert.equal(data.settings.sound, true)
    assert.equal(data.stats.habitsCompleted, 3)
    assert.equal(data.cloudSync, undefined)
  })

  it('no incluye claves ajenas al prefijo', () => {
    localStorage.setItem('other_app', 'x')
    setItem('habits', [{ id: 'h1' }])
    const data = exportAllData()
    assert.ok(data.habits)
    assert.equal(data.other_app, undefined)
  })
})
