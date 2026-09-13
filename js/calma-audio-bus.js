/** Bus de audio compartido — voz + ambiente en un solo contexto (mejor mezcla). */

const SILENT_WAV = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA'

let ctx = null
let voiceFilter = null
let voiceGain = null
let ambientGain = null
let primedVoiceAudio = null

function ensureCalmaNodes() {
  if (ctx) return
  ctx = new (window.AudioContext || window.webkitAudioContext)()

  ambientGain = ctx.createGain()
  ambientGain.gain.value = 1

  voiceFilter = ctx.createBiquadFilter()
  voiceFilter.type = 'lowpass'
  voiceFilter.frequency.value = 12800
  voiceFilter.Q.value = 0.65

  voiceGain = ctx.createGain()
  voiceGain.gain.value = 1.12

  ambientGain.connect(ctx.destination)
  voiceFilter.connect(voiceGain)
  voiceGain.connect(ctx.destination)
}

/** Llamar sincrónicamente en el click del usuario — evita AudioContext suspendido. */
export function unlockCalmaAudioOnGesture() {
  try {
    ensureCalmaNodes()
    if (ctx?.state === 'suspended') void ctx.resume()
    primeVoiceAudioOnGesture()
  } catch (_) {}
}

/** Activa un <audio> en el gesto — permite play() tras fetch de Fish TTS. */
export function primeVoiceAudioOnGesture() {
  try {
    if (!primedVoiceAudio) {
      primedVoiceAudio = new Audio()
      primedVoiceAudio.setAttribute('playsinline', '')
      primedVoiceAudio.preload = 'auto'
    }
    primedVoiceAudio.volume = 0.001
    if (!primedVoiceAudio.src || primedVoiceAudio.src === window.location.href) {
      primedVoiceAudio.src = SILENT_WAV
    }
    const p = primedVoiceAudio.play()
    if (p) p.catch(() => {})
  } catch (_) {}
}

export function getPrimedVoiceAudio() {
  if (!primedVoiceAudio) primeVoiceAudioOnGesture()
  return primedVoiceAudio
}

export async function getCalmaAudioContext() {
  ensureCalmaNodes()
  if (ctx.state === 'suspended') await ctx.resume()
  return ctx
}

export function getVoiceOutputNode() {
  return voiceFilter
}

export function getAmbientOutputNode() {
  return ambientGain
}
