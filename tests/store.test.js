import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { Store, STORE_PREFIX } from '../js/core/store.js'

function clearStore(store) {
  Object.keys(localStorage)
    .filter(k => k.startsWith(store.prefix))
    .forEach(k => localStorage.removeItem(k))
}

describe('store — observador y dominio', () => {
  it('persiste y lee progress', () => {
    const store = new Store(`${STORE_PREFIX}test_`)
    clearStore(store)
    const saved = store.saveProgress({ xp: { mental: 42, mindfulness: 0, discipline: 0, wisdom: 0 } })
    assert.equal(saved.xp.mental, 42)
    assert.equal(store.getProgress().xp.mental, 42)
    clearStore(store)
  })

  it('notifica suscriptores al cambiar una clave', () => {
    const store = new Store(`${STORE_PREFIX}test_`)
    clearStore(store)
    let hits = 0
    store.subscribe('settings', () => { hits += 1 })
    store.saveSettings({ ...store.getSettings(), userName: 'Ana' })
    assert.equal(hits, 1)
    clearStore(store)
  })

  it('patchProgress muta sin reemplazar referencia externa manual', () => {
    const store = new Store(`${STORE_PREFIX}test_`)
    clearStore(store)
    store.patchProgress(p => {
      p.xp.mental = 7
      return p
    })
    assert.equal(store.getProgress().xp.mental, 7)
    clearStore(store)
  })
})
