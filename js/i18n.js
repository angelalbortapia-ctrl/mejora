/** i18n — capa de traducción para UI (contenido curado sigue en español) */

import { getSettings, saveSettings } from '/js/core.js'
import es from '/js/locales/es.js'
import en from '/js/locales/en.js'

const LOCALES = { es, en }
const SUPPORTED = ['es', 'en']

let locale = 'es'
let dict = es

export function getLocale() {
  return locale
}

export function getSupportedLocales() {
  return SUPPORTED
}

export function t(key, vars = {}) {
  const parts = String(key).split('.')
  let value = dict
  for (const part of parts) {
    value = value?.[part]
  }
  if (typeof value !== 'string') return key
  return value.replace(/\{(\w+)\}/g, (_, k) => (vars[k] != null ? String(vars[k]) : `{${k}}`))
}

export function initI18n(forcedLocale) {
  const settings = getSettings()
  const next = forcedLocale || settings.locale || 'es'
  locale = SUPPORTED.includes(next) ? next : 'es'
  dict = LOCALES[locale] || LOCALES.es
  document.documentElement.lang = locale
  return locale
}

export function setLocale(next) {
  const loc = SUPPORTED.includes(next) ? next : 'es'
  const s = getSettings()
  s.locale = loc
  saveSettings(s)
  initI18n(loc)
  window.dispatchEvent(new CustomEvent('mejora:locale', { detail: { locale: loc } }))
  return loc
}
