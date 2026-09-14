/** Azure Speech — key opcional vía archivo local (no se sube a git). */
export let AZURE_SPEECH_KEY = ''
export let AZURE_SPEECH_REGION = 'eastus'

let configReady = null

export function ensureAzureConfig() {
  if (!configReady) {
    configReady = import('/js/azure-config.local.js')
      .then((local) => {
        if (local.AZURE_SPEECH_KEY) AZURE_SPEECH_KEY = local.AZURE_SPEECH_KEY
        if (local.AZURE_SPEECH_REGION) AZURE_SPEECH_REGION = local.AZURE_SPEECH_REGION
      })
      .catch(() => {})
      .finally(() => {
        window.dispatchEvent(new CustomEvent('mejora:azure-ready'))
      })
  }
  return configReady
}

export function isAzureConfigFilePresent() {
  return Boolean(AZURE_SPEECH_KEY)
}
