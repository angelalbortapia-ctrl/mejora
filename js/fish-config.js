/** Fish Audio — key y voz opcionales vía archivo local (no se sube a git). */
export let FISH_API_KEY = ''
export let FISH_VOICE_ID = ''

let configReady = null

export function ensureFishConfig() {
  if (!configReady) {
    configReady = import('./fish-config.local.js')
      .then((local) => {
        if (local.FISH_API_KEY) FISH_API_KEY = local.FISH_API_KEY
        if (local.FISH_VOICE_ID) FISH_VOICE_ID = local.FISH_VOICE_ID
      })
      .catch(() => {})
      .finally(() => {
        window.dispatchEvent(new CustomEvent('mejora:fish-ready'))
      })
  }
  return configReady
}

export function isFishConfigFilePresent() {
  return Boolean(FISH_API_KEY)
}
