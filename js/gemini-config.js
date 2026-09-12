/** API key Gemini — opcional vía archivo local (no se sube a git). */
export let GEMINI_API_KEY = ''

let configReady = null

export function ensureGeminiConfig() {
  if (!configReady) {
    configReady = import('./gemini-config.local.js')
      .then((local) => {
        if (local.GEMINI_API_KEY) GEMINI_API_KEY = local.GEMINI_API_KEY
      })
      .catch(() => {})
      .finally(() => {
        window.dispatchEvent(new CustomEvent('mejora:gemini-ready'))
      })
  }
  return configReady
}

export function isGeminiConfigFilePresent() {
  return Boolean(GEMINI_API_KEY)
}
