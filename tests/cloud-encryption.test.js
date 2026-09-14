import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { PREFIX, getSettings, saveSettings } from '../js/core.js'
import {
  encryptCloudPayload, decryptCloudPayload, isEncryptedCloudPayload,
} from '../js/cloud-sync.js'

function clearMejora() {
  Object.keys(localStorage).filter(k => k.startsWith(PREFIX)).forEach(k => localStorage.removeItem(k))
}

describe('cloud encryption', () => {
  beforeEach(() => {
    clearMejora()
    const s = getSettings()
    s.syncEncryptionSalt = 'dGVzdC1zYWx0LTEyMzQ1Ng=='
    saveSettings(s)
  })

  it('cifra y descifra payload', async () => {
    const plain = { progress: { xp: { mental: 10 } }, mood: 'ok' }
    const wrapped = await encryptCloudPayload(plain, 'mi-frase-secreta')
    assert.equal(isEncryptedCloudPayload(wrapped), true)
    const back = await decryptCloudPayload(wrapped, 'mi-frase-secreta')
    assert.deepEqual(back, plain)
  })

  it('falla con frase incorrecta', async () => {
    const wrapped = await encryptCloudPayload({ a: 1 }, 'frase-correcta')
    await assert.rejects(() => decryptCloudPayload(wrapped, 'frase-mala'))
  })
})
