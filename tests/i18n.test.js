import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { t, initI18n, setLocale, getLocale } from '../js/i18n.js'
import { PREFIX, saveSettings, getSettings } from '../js/core.js'

describe('i18n', () => {
  it('traduce nav en español por defecto', () => {
    initI18n('es')
    assert.equal(t('nav.home'), 'Hoy')
  })

  it('cambia a inglés', () => {
    const s = getSettings()
    s.locale = 'es'
    saveSettings(s)
    setLocale('en')
    assert.equal(getLocale(), 'en')
    assert.equal(t('nav.home'), 'Today')
    setLocale('es')
  })

  it('devuelve la clave si falta traducción', () => {
    initI18n('es')
    assert.equal(t('missing.key'), 'missing.key')
  })
})
